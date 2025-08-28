import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"
import { cinetPayService } from "@/lib/services/cinetpay"
import { validateCinetpayConfig } from "@/lib/config/cinetpay"
import { withSecurity, addSecurityHeaders } from "@/lib/security/securityMiddleware"
import { validateWithSecurity, secureSchemas, validateAmounts } from "@/lib/security/validation"
import { errorHandler, ERROR_TYPES } from "@/lib/errors/errorHandler"
import { logger } from "@/lib/errors/logger"
import { circuitBreakerManager } from "@/lib/errors/circuitBreaker"
import { retryManager, RETRY_CONFIGS } from "@/lib/errors/retrySystem"
import { getCinetPayConfig } from "@/lib/utils/url"

/**
 * Créer un lien de paiement CinetPay avec sécurité renforcée et gestion d'erreurs avancée
 */
async function handlePaymentCreation(request) {
  const requestId = errorHandler.generateErrorId()
  let supabase
  let transactionRecord = null

  return await errorHandler.safeExecute(async () => {
    await logger.info('Payment creation started', {
      requestId,
      endpoint: '/api/payments/cinetpay',
      method: 'POST'
    });

    // Validation de la configuration avec retry
    await retryManager.execute('config_validation', async () => {
      validateCinetpayConfig();
    }, RETRY_CONFIGS.api);

    supabase = await createClient();
    
    // Vérification de l'authentification
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentification requise' }, 
        { status: 401 }
      )
    }

    const requestData = await request.json()
    
    // Validation sécurisée avec Zod
    const validation = validateWithSecurity(
      secureSchemas.paymentData, 
      requestData, 
      'payment_creation'
    )
    
    if (!validation.success) {
      console.warn('Validation échouée:', validation.details)
      return NextResponse.json(
        { 
          error: validation.error,
          details: validation.details,
          code: 'VALIDATION_FAILED'
        },
        { status: 400 }
      )
    }
    
    const { cartItems, paymentMethod, customerData, currency } = validation.data

    // Validation des services et calcul des totaux avec circuit breaker
    const serviceIds = cartItems.map(item => item.service_id)
    
    const services = await circuitBreakerManager.execute(
      'database_services',
      async () => {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .in('id', serviceIds)
          .eq('is_active', true)

        if (error) {
          throw new Error(`Database error: ${error.message}`)
        }
        return data
      },
      null, // fallback
      { 
        failureThreshold: 3, 
        recoveryTimeout: 30000,
        timeout: 5000
      }
    )

    if (services.length !== serviceIds.length) {
      return NextResponse.json(
        { error: 'Un ou plusieurs services sont invalides ou indisponibles' },
        { status: 400 }
      )
    }

    // Recalculer les totaux pour la sécurité (côté serveur)
    const validatedItems = cartItems.map(item => {
      const service = services.find(s => s.id === item.service_id)
      if (!service) {
        throw new Error(`Service ${item.service_id} non trouvé`)
      }

      // Vérifier les limites de quantité
      if (item.quantity < service.min_quantity || item.quantity > service.max_quantity) {
        throw new Error(`Quantité invalide pour ${service.name}. Min: ${service.min_quantity}, Max: ${service.max_quantity}`)
      }

      return {
        ...item,
        service_name: service.name,
        platform_id: service.platform_id,
        price_usd: service.price_usd,
        price_cdf: service.price_cdf,
        total_usd: service.price_usd * item.quantity,
        total_cdf: service.price_cdf * item.quantity
      }
    })

    // Validation sécurisée des montants avec vérification de cohérence
    const totalCalculated = currency === 'USD' 
      ? validatedItems.reduce((sum, item) => sum + item.total_usd, 0)
      : validatedItems.reduce((sum, item) => sum + item.total_cdf, 0)

    try {
      validateAmounts(validatedItems, currency, totalCalculated)
    } catch (error) {
      console.error('Erreur validation montants:', error)
      return NextResponse.json(
        { 
          error: 'Erreur de validation des montants',
          details: error.message,
          code: 'AMOUNT_VALIDATION_FAILED'
        },
        { status: 400 }
      )
    }

    // Génération de l'ID de transaction unique
    const transactionId = cinetPayService.generateTransactionId()

    // Préparation des données client
    const finalCustomerData = {
      customerName: customerData.name,
      customerEmail: customerData.email,
      customerPhone: customerData.phone,
      customerAddress: customerData.address || '',
      customerCity: customerData.city || 'Kinshasa',
      customerCountry: 'CD'
    }

    // Préparation des données de paiement
    const paymentData = {
      transactionId,
      amount: totalCalculated,
      currency: currency,
      description: `Commande Okit-Boost - ${validatedItems.length} service(s)`,
      ...finalCustomerData,
      channels: cinetPayService.getOptimizedChannels(paymentMethod, 'CD'),
      metadata: {
        userId: user.id,
        paymentMethod: paymentMethod,
        cartItems: validatedItems, // On sauvegarde les items pour créer la commande plus tard
        currency: currency,
        totalUSD: validatedItems.reduce((sum, item) => sum + item.total_usd, 0),
        totalCDF: validatedItems.reduce((sum, item) => sum + item.total_cdf, 0)
      }
    }

    await logger.debug('Creating CinetPay payment', {
      requestId,
      transactionId,
      amount: paymentData.amount,
      currency: paymentData.currency,
      customerData: {
        name: paymentData.customerName,
        email: paymentData.customerEmail,
        phone: paymentData.customerPhone
      }
    });

    // Validation des données avant création
    cinetPayService.validatePaymentData(paymentData)

    // Création de l'enregistrement de transaction en base avec retry et circuit breaker
    transactionRecord = await retryManager.execute(
      'transaction_creation',
      async () => {
        const { data: transaction, error: transactionError } = await supabase
          .from('payment_transactions')
          .insert({
            user_id: user.id,
            transaction_id: transactionId,
            amount: paymentData.amount,
            currency: paymentData.currency,
            payment_method: paymentMethod,
            status: 'pending',
            provider: 'cinetpay',
            customer_phone: paymentData.customerPhone,
            customer_email: paymentData.customerEmail,
            metadata: JSON.stringify(paymentData.metadata),
            created_at: new Date().toISOString()
          })
          .select()
          .single()

        if (transactionError) {
          throw new Error(`Database error: ${transactionError.message}`)
        }
        
        await logger.logPayment('transaction_created', {
          transactionId,
          amount: paymentData.amount,
          currency: paymentData.currency,
          userId: user.id,
          status: 'pending'
        });

        return transaction
      },
      RETRY_CONFIGS.database,
      { requestId, operation: 'transaction_creation' }
    )

    // Création du lien de paiement CinetPay avec circuit breaker
    const paymentResult = await circuitBreakerManager.execute(
      'cinetpay_payment',
      async () => {
        await logger.debug('Creating CinetPay payment link', {
          requestId,
          transactionId,
          amount: paymentData.amount,
          currency: paymentData.currency
        });
        
        return await cinetPayService.createPaymentLink(paymentData)
      },
      async (error) => {
        // Fallback: marquer la transaction comme échouée
        await logger.error('CinetPay payment creation failed, using fallback', {
          requestId,
          transactionId,
          error: error.message
        });
        
        throw new Error(`Payment service unavailable: ${error.message}`)
      },
      {
        failureThreshold: 2,
        recoveryTimeout: 60000,
        timeout: 15000,
        expectedErrors: ['INSUFFICIENT_FUNDS', 'INVALID_CUSTOMER_DATA']
      }
    )

    // Mise à jour avec les informations CinetPay avec retry
    await retryManager.execute(
      'transaction_update',
      async () => {
        const { error: updateError } = await supabase
          .from('payment_transactions')
          .update({
            payment_token: paymentResult.paymentToken,
            provider_response: JSON.stringify(paymentResult),
            expires_at: paymentResult.expiresAt,
            updated_at: new Date().toISOString()
          })
          .eq('id', transactionRecord.id)

        if (updateError) {
          throw new Error(`Database error: ${updateError.message}`)
        }
      },
      RETRY_CONFIGS.database,
      { requestId, operation: 'transaction_update' }
    )

    // Log de succès
    await logger.logPayment('payment_link_created', {
      transactionId,
      amount: paymentData.amount,
      currency: paymentData.currency,
      userId: user.id,
      status: 'pending',
      paymentUrl: paymentResult.paymentUrl
    }, { requestId });

    await logger.info('Payment creation completed successfully', {
      requestId,
      transactionId,
      amount: paymentData.amount,
      currency: paymentData.currency
    });

    return NextResponse.json({
      success: true,
      transactionId: transactionId,
      paymentUrl: paymentResult.paymentUrl,
      paymentToken: paymentResult.paymentToken,
      expiresAt: paymentResult.expiresAt,
      amount: paymentData.amount,
      currency: paymentData.currency,
      description: paymentData.description
    })

  }, {
    requestId,
    endpoint: '/api/payments/cinetpay',
    method: 'POST',
    userId: null, // sera mis à jour si disponible
    metadata: { operation: 'payment_creation' }
  });
}

// Exporter la fonction avec protection de sécurité
export const POST = withSecurity(handlePaymentCreation, '/api/payments/cinetpay')

/**
 * Mettre à jour le statut de la commande selon le statut du paiement
 */

export async function updateOrderStatus(supabase, orderId, paymentStatus) {
  try {
    const updateData = { updated_at: new Date().toISOString() }

    switch (paymentStatus) {
      case "ACCEPTED":
        updateData.status = "processing"
        updateData.payment_status = "paid"
        updateData.paid_at = new Date().toISOString()
        break

      case "REFUSED":
        updateData.payment_status = "failed"
        updateData.admin_notes = "Paiement refusé par CinetPay"
        break

      case "CANCELLED":
        updateData.status = "cancelled"
        updateData.payment_status = "cancelled"
        updateData.admin_notes = "Paiement annulé par l'utilisateur"
        break

      default:
        // Pas de mise à jour pour PENDING ou autres statuts
        console.log(`Aucune mise à jour pour le statut ${paymentStatus}`)
        return
    }

    const { error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", orderId)

    if (error) {
      console.error("❌ Erreur mise à jour statut commande:", error)
      throw error
    }

    console.log(`✅ Commande ${orderId} mise à jour: statut ${paymentStatus}`)
  } catch (error) {
    console.error("🔥 Erreur updateOrderStatus:", error)
    throw error // on relance pour que l'appelant puisse gérer
  }
}


/**
 * Vérifier le statut d'une transaction avec gestion d'erreurs avancée
 */
export async function GET(request) {
  const requestId = errorHandler.generateErrorId()
  
  return await errorHandler.safeExecute(async () => {
    await logger.info('Transaction status check started', {
      requestId,
      endpoint: '/api/payments/cinetpay',
      method: 'GET'
    });

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('transactionId')
    const userId = searchParams.get('userId')

    if (!transactionId) {
      await logger.warn('Missing transaction ID in status check', { requestId });
      return NextResponse.json(
        { error: 'ID de transaction requis' },
        { status: 400 }
      )
    }

    // Construction de la requête avec filtrage optionnel par utilisateur et circuit breaker
    const transaction = await circuitBreakerManager.execute(
      'database_transaction_lookup',
      async () => {
        let query = supabase
          .from('payment_transactions')
          .select(`
            *,
            orders (
              id,
              order_number,
              status,
              user_id,
              customer_name,
              customer_email,
              total_usd,
              total_cdf,
              currency
            )
          `)
          .eq('transaction_id', transactionId)

        if (userId) {
          query = query.eq('user_id', userId)
        }

        const { data, error } = await query.single()

        if (error) {
          throw new Error(`Database error: ${error.message}`)
        }
        
        if (!data) {
          throw new Error('Transaction not found')
        }

        return data
      },
      null, // no fallback
      { 
        failureThreshold: 3, 
        recoveryTimeout: 30000,
        timeout: 5000
      }
    )

    await logger.debug('Transaction found', {
      requestId,
      transactionId,
      status: transaction.status,
      userId: transaction.user_id
    });

    // Vérification du statut auprès de CinetPay si la transaction est encore en attente
    let currentStatus = transaction.status
    let statusResult = null

    if (['pending', 'PENDING'].includes(transaction.status)) {
      await logger.debug('Checking CinetPay status for pending transaction', {
        requestId,
        transactionId
      });
      
      try {
        statusResult = await circuitBreakerManager.execute(
          'cinetpay_status_check',
          async () => {
            return await cinetPayService.checkTransactionStatus(
              transactionId, 
              transaction.payment_token
            )
          },
          async (error) => {
            // Fallback: retourner le statut en base si CinetPay ne répond pas
            await logger.warn('CinetPay status check failed, using database status', {
              requestId,
              transactionId,
              error: error.message
            });
            
            return { 
              status: transaction.status,
              fallback: true 
            }
          },
          {
            failureThreshold: 2,
            recoveryTimeout: 120000,
            timeout: 10000
          }
        )

        currentStatus = statusResult.status
        
        // Mise à jour en base si le statut a changé avec retry
        if (statusResult.status !== transaction.status && !statusResult.fallback) {
          await logger.info('Status changed, updating database', {
            requestId,
            transactionId,
            oldStatus: transaction.status,
            newStatus: statusResult.status
          });
          
          await retryManager.execute(
            'status_update',
            async () => {
              const updateData = {
                status: statusResult.status,
                provider_response: JSON.stringify(statusResult),
                updated_at: new Date().toISOString()
              }

              // Si le paiement est accepté, marquer comme complété
              if (statusResult.status === 'ACCEPTED') {
                updateData.completed_at = new Date().toISOString()
              }

              const { error } = await supabase
                .from('payment_transactions')
                .update(updateData)
                .eq('id', transaction.id)

              if (error) {
                throw new Error(`Database error: ${error.message}`)
              }

              // Mise à jour du statut de la commande si elle existe
              if (transaction.order_id) {
                await updateOrderStatus(supabase, transaction.order_id, statusResult.status)
              }
            },
            RETRY_CONFIGS.database,
            { requestId, operation: 'status_update' }
          )
        }
      } catch (statusError) {
        await logger.error('Error during CinetPay status check', {
          requestId,
          transactionId,
          error: statusError.message
        });
        
        // Continue avec le statut en base même si la vérification échoue
        statusResult = { status: transaction.status, fallback: true }
        currentStatus = transaction.status
      }
    }

    await logger.info('Transaction status check completed', {
      requestId,
      transactionId,
      status: currentStatus,
      fallback: statusResult?.fallback || false
    });

    return NextResponse.json({
      success: true,
      transactionId,
      status: currentStatus,
      amount: transaction.amount,
      currency: transaction.currency,
      paymentMethod: transaction.payment_method,
      paymentDate: statusResult?.paymentDate || transaction.completed_at,
      customerPhone: statusResult?.customerPhone || transaction.customer_phone,
      order: transaction.orders ? {
        id: transaction.orders.id,
        orderNumber: transaction.orders.order_number,
        status: transaction.orders.status,
        customerName: transaction.orders.customer_name
      } : null,
      lastChecked: new Date().toISOString(),
      fallback: statusResult?.fallback || false
    })

  }, {
    requestId,
    endpoint: '/api/payments/cinetpay',
    method: 'GET',
    userId: userId,
    metadata: { operation: 'status_check', transactionId }
  });
}