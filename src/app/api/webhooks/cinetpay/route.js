// src/app/api/webhooks/cinetpay/route.js
import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"
import { cinetPayService } from "@/lib/services/cinetpay"
import { headers } from "next/headers"

/**
 * Gestionnaire webhook CinetPay avec sécurité renforcée
 */
export async function POST(request) {
  const startTime = Date.now()
  let webhookId = null
  let supabase = null

  try {
    supabase = await createClient()
    const payload = await request.json()
    const headersList = await headers()
    
    console.log('=== Webhook CinetPay Reçu ===')
    console.log('Payload:', JSON.stringify(payload, null, 2))
    console.log('Headers:', Object.fromEntries(headersList.entries()))

    // Vérification de sécurité IP (optionnel - à configurer selon vos besoins)
    const clientIP = headersList.get('x-forwarded-for') || headersList.get('x-real-ip')
    console.log('IP Cliente:', clientIP)

    // Validation de base du payload
    if (!payload || typeof payload !== 'object') {
      throw new Error('Payload webhook invalide')
    }

    // Enregistrement immédiat du webhook pour audit (même en cas d'erreur)
    const { data: webhookRecord, error: webhookError } = await supabase
      .from('webhook_events')
      .insert({
        provider: 'cinetpay',
        event_type: 'payment_notification',
        transaction_id: payload.cpm_trans_id || null,
        payload: payload,
        headers: Object.fromEntries(headersList.entries()),
        client_ip: clientIP,
        received_at: new Date().toISOString(),
        processed: false
      })
      .select()
      .single()

    if (webhookError) {
      console.error('Erreur enregistrement webhook:', webhookError)
    } else {
      webhookId = webhookRecord.id
    }

    // Traitement du webhook CinetPay
    const webhookData = cinetPayService.processWebhookNotification(payload)
    console.log('Données webhook traitées:', webhookData)

    // Récupération de la transaction (sans commande car elle n'existe peut-être pas encore)
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('transaction_id', webhookData.transactionId)
      .single()

    if (transactionError || !transaction) {
      console.error('Transaction non trouvée:', webhookData.transactionId, transactionError)
      
      // Marquer le webhook comme traité avec erreur
      if (webhookId) {
        await supabase
          .from('webhook_events')
          .update({
            processed: true,
            error_message: `Transaction non trouvée: ${webhookData.transactionId}`,
            processed_at: new Date().toISOString(),
            processing_time_ms: Date.now() - startTime
          })
          .eq('id', webhookId)
      }

      return NextResponse.json(
        { error: 'Transaction non trouvée' },
        { status: 404 }
      )
    }

    console.log('Transaction trouvée:', {
      id: transaction.id,
      currentStatus: transaction.status,
      newStatus: webhookData.status,
      userId: transaction.user_id
    })

    // Éviter le traitement de doublons
    if (transaction.status === webhookData.status) {
      console.log('Statut déjà à jour, webhook ignoré')
      
      if (webhookId) {
        await supabase
          .from('webhook_events')
          .update({
            processed: true,
            status: webhookData.status,
            processed_at: new Date().toISOString(),
            processing_time_ms: Date.now() - startTime,
            notes: 'Webhook dupliqué - déjà traité'
          })
          .eq('id', webhookId)
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Webhook déjà traité',
        transactionId: webhookData.transactionId,
        status: webhookData.status
      })
    }

    // Début de transaction DB pour assurer la cohérence
    const { error: beginError } = await supabase.rpc('begin_transaction')
    if (beginError) {
      console.error('Erreur début transaction DB:', beginError)
    }

    try {
      // Mise à jour de la transaction de paiement
      const transactionUpdateData = {
        status: webhookData.status,
        provider_response: JSON.stringify(webhookData),
        payment_date: webhookData.paymentDate,
        operator_id: webhookData.operatorId,
        updated_at: new Date().toISOString()
      }

      if (webhookData.status === 'ACCEPTED') {
        transactionUpdateData.completed_at = new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('payment_transactions')
        .update(transactionUpdateData)
        .eq('id', transaction.id)

      if (updateError) {
        throw new Error(`Erreur mise à jour transaction: ${updateError.message}`)
      }

      // Traitement selon le statut
      await processPaymentStatusChange(supabase, transaction, webhookData)

      // Commit de la transaction DB
      await supabase.rpc('commit_transaction')

      // Marquer le webhook comme traité avec succès
      if (webhookId) {
        await supabase
          .from('webhook_events')
          .update({
            processed: true,
            status: webhookData.status,
            transaction_db_id: transaction.id,
            processed_at: new Date().toISOString(),
            processing_time_ms: Date.now() - startTime,
            notes: `Traité avec succès - ${webhookData.status}`
          })
          .eq('id', webhookId)
      }

      console.log(`=== Webhook CinetPay traité avec succès ===`)
      console.log(`Transaction: ${webhookData.transactionId}`)
      console.log(`Nouveau statut: ${webhookData.status}`)
      console.log(`Temps de traitement: ${Date.now() - startTime}ms`)

      return NextResponse.json({
        success: true,
        transactionId: webhookData.transactionId,
        status: webhookData.status,
        processedAt: new Date().toISOString(),
        processingTime: Date.now() - startTime
      })

    } catch (processingError) {
      // Rollback en cas d'erreur
      await supabase.rpc('rollback_transaction')
      throw processingError
    }

  } catch (error) {
    console.error('=== Erreur traitement webhook CinetPay ===')
    console.error('Erreur:', error.message)
    console.error('Stack:', error.stack)

    // Log de l'erreur en base pour monitoring
    if (supabase && webhookId) {
      try {
        await supabase
          .from('webhook_events')
          .update({
            processed: true,
            error_message: error.message,
            processed_at: new Date().toISOString(),
            processing_time_ms: Date.now() - startTime
          })
          .eq('id', webhookId)
      } catch (logError) {
        console.error('Erreur log webhook en base:', logError)
      }
    }

    // Retourner une erreur 500 pour que CinetPay puisse réessayer
    return NextResponse.json(
      { 
        error: 'Erreur interne lors du traitement du webhook',
        code: 'WEBHOOK_PROCESSING_FAILED',
        transactionId: error.transactionId || null,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * Traiter le changement de statut selon le nouveau statut
 */
async function processPaymentStatusChange(supabase, transaction, webhookData) {
  switch (webhookData.status) {
    case 'ACCEPTED':
      await handlePaymentAccepted(supabase, transaction, webhookData)
      break
    
    case 'REFUSED':
      await handlePaymentRefused(supabase, transaction, webhookData)
      break
    
    case 'CANCELLED':
      await handlePaymentCancelled(supabase, transaction, webhookData)
      break
    
    default:
      console.log(`Statut webhook non géré: ${webhookData.status}`)
      break
  }
}

/**
 * Traiter un paiement accepté - CRÉER LA COMMANDE ICI
 */
async function handlePaymentAccepted(supabase, transaction, webhookData) {
  try {
    console.log(`Traitement paiement accepté pour transaction ${webhookData.transactionId}`)

    // Récupérer les métadonnées de la transaction pour créer la commande
    const metadata = JSON.parse(transaction.metadata || '{}')
    const cartItems = metadata.cartItems || []

    if (!cartItems.length) {
      throw new Error('Aucun item trouvé dans les métadonnées de la transaction')
    }

    // Générer un numéro de commande unique
    const orderNumber = `OKIT${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    // Créer la commande maintenant que le paiement est confirmé
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: transaction.user_id,
        total_usd: metadata.totalUSD || 0,
        total_cdf: metadata.totalCDF || 0,
        currency: metadata.currency || 'CDF',
        customer_name: transaction.customer_name || 'Client',
        customer_email: transaction.customer_email,
        customer_phone: transaction.customer_phone,
        payment_method: webhookData.paymentMethod,
        payment_transaction_id: transaction.transaction_id,
        status: 'processing',
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
        admin_notes: `Paiement confirmé via ${webhookData.paymentMethod} - Opérateur: ${webhookData.operatorId || 'N/A'}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (orderError) {
      throw new Error(`Erreur création commande: ${orderError.message}`)
    }

    // Créer les items de la commande
    const orderItems = cartItems.map(item => ({
      order_id: order.id,
      service_id: item.service_id,
      service_name: item.service_name,
      platform_name: item.platform_id,
      target_link: item.target_link,
      quantity: item.quantity,
      unit_price_usd: item.price_usd,
      unit_price_cdf: item.price_cdf,
      total_usd: item.total_usd,
      total_cdf: item.total_cdf
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      // Rollback: supprimer la commande si les items n'ont pas pu être créés
      await supabase.from('orders').delete().eq('id', order.id)
      throw new Error(`Erreur création items commande: ${itemsError.message}`)
    }

    // Mettre à jour la transaction avec l'ID de la commande créée
    await supabase
      .from('payment_transactions')
      .update({
        order_id: order.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.id)

    // Envoi des notifications
    await Promise.all([
      sendPaymentConfirmationEmail(order, webhookData),
      notifyAdminNewPayment(order, webhookData),
      logPaymentSuccess(order, webhookData)
    ])

    console.log(`✅ Commande ${orderNumber} créée avec succès après paiement confirmé`)

  } catch (error) {
    console.error('Erreur traitement paiement accepté:', error)
    throw error
  }
}

/**
 * Traiter un paiement refusé - PAS DE COMMANDE À METTRE À JOUR
 */
async function handlePaymentRefused(supabase, transaction, webhookData) {
  try {
    console.log(`Traitement paiement refusé pour transaction ${webhookData.transactionId}`)

    // Pas de commande à mettre à jour car elle n'existe pas encore
    // La transaction reste avec le statut REFUSED
    
    // Notification du client (optionnel)
    await sendPaymentFailureEmail({
      customer_email: transaction.customer_email,
      customer_name: transaction.customer_name || 'Client',
      transaction_id: webhookData.transactionId
    }, webhookData)

    console.log(`Paiement refusé traité pour transaction ${webhookData.transactionId}`)

  } catch (error) {
    console.error('Erreur traitement paiement refusé:', error)
    throw error
  }
}

/**
 * Traiter un paiement annulé - PAS DE COMMANDE À METTRE À JOUR
 */
async function handlePaymentCancelled(supabase, transaction, webhookData) {
  try {
    console.log(`Traitement paiement annulé pour transaction ${webhookData.transactionId}`)

    // Pas de commande à mettre à jour car elle n'existe pas encore
    // La transaction reste avec le statut CANCELLED

    console.log(`Paiement annulé traité pour transaction ${webhookData.transactionId}`)

  } catch (error) {
    console.error('Erreur traitement paiement annulé:', error)
    throw error
  }
}

/**
 * Fonctions de notification (à implémenter selon vos besoins)
 */
async function sendPaymentConfirmationEmail(orderData, webhookData) {
  try {
    // TODO: Implémenter l'envoi d'email de confirmation
    console.log(`Email confirmation paiement à envoyer à: ${orderData.customer_email}`)
    console.log(`Commande: ${orderData.order_number}`)
    console.log(`Montant: ${webhookData.amount} ${webhookData.currency}`)
    
    // Exemple d'implémentation avec un service d'email
    /*
    await emailService.send({
      to: orderData.customer_email,
      template: 'payment-confirmation',
      data: {
        customerName: orderData.customer_name,
        orderNumber: orderData.order_number,
        amount: webhookData.amount,
        currency: webhookData.currency,
        paymentMethod: webhookData.paymentMethod,
        transactionId: webhookData.transactionId
      }
    })
    */
  } catch (error) {
    console.error('Erreur envoi email confirmation:', error)
  }
}

async function sendPaymentFailureEmail(orderData, webhookData) {
  try {
    console.log(`Email échec paiement à envoyer à: ${orderData.customer_email}`)
    
    // TODO: Implémenter selon vos besoins
  } catch (error) {
    console.error('Erreur envoi email échec:', error)
  }
}

async function notifyAdminNewPayment(orderData, webhookData) {
  try {
    console.log('Notification admin nouveau paiement')
    console.log(`Commande: ${orderData.order_number}`)
    console.log(`Client: ${orderData.customer_name}`)
    console.log(`Montant: ${webhookData.amount} ${webhookData.currency}`)
    
    // TODO: Implémenter notification admin (email, Slack, Discord, etc.)
  } catch (error) {
    console.error('Erreur notification admin:', error)
  }
}

async function logPaymentSuccess(orderData, webhookData) {
  try {
    console.log('=== PAIEMENT RÉUSSI ===')
    console.log(`Commande: ${orderData.order_number}`)
    console.log(`Client: ${orderData.customer_name} (${orderData.customer_email})`)
    console.log(`Montant: ${webhookData.amount} ${webhookData.currency}`)
    console.log(`Méthode: ${webhookData.paymentMethod}`)
    console.log(`Transaction: ${webhookData.transactionId}`)
    console.log(`Date: ${webhookData.paymentDate}`)
    console.log('========================')
  } catch (error) {
    console.error('Erreur log paiement:', error)
  }
}

/**
 * Endpoint GET pour vérifier l'état du webhook
 */
export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: 'Webhook CinetPay endpoint actif',
    version: '2.0',
    timestamp: new Date().toISOString(),
    status: 'operational'
  })
}