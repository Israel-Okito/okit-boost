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

    // Récupération de la transaction avec informations de commande
    const { data: transaction, error: transactionError } = await supabase
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
      orderId: transaction.order_id
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
        orderNumber: transaction.orders.order_number,
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
  const orderId = transaction.order_id
  const orderData = transaction.orders

  switch (webhookData.status) {
    case 'ACCEPTED':
      await handlePaymentAccepted(supabase, orderId, orderData, webhookData)
      break
    
    case 'REFUSED':
      await handlePaymentRefused(supabase, orderId, orderData, webhookData)
      break
    
    case 'CANCELLED':
      await handlePaymentCancelled(supabase, orderId, orderData, webhookData)
      break
    
    default:
      console.log(`Statut webhook non géré: ${webhookData.status}`)
      break
  }
}

/**
 * Traiter un paiement accepté
 */
async function handlePaymentAccepted(supabase, orderId, orderData, webhookData) {
  try {
    console.log(`Traitement paiement accepté pour commande ${orderData.order_number}`)

    // Mise à jour de la commande
    const { error: orderError } = await supabase
      .from('orders')
      .update({
        status: 'processing',
        payment_status: 'paid',
        payment_method: webhookData.paymentMethod,
        paid_at: new Date().toISOString(),
        admin_notes: `Paiement confirmé via ${webhookData.paymentMethod} - Opérateur: ${webhookData.operatorId || 'N/A'}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (orderError) {
      throw new Error(`Erreur mise à jour commande: ${orderError.message}`)
    }

    // Envoi des notifications
    await Promise.all([
      sendPaymentConfirmationEmail(orderData, webhookData),
      notifyAdminNewPayment(orderData, webhookData),
      logPaymentSuccess(orderData, webhookData)
    ])

    console.log(`Paiement accepté traité avec succès pour commande ${orderData.order_number}`)

  } catch (error) {
    console.error('Erreur traitement paiement accepté:', error)
    throw error
  }
}

/**
 * Traiter un paiement refusé
 */
async function handlePaymentRefused(supabase, orderId, orderData, webhookData) {
  try {
    console.log(`Traitement paiement refusé pour commande ${orderData.order_number}`)

    const { error: orderError } = await supabase
      .from('orders')
      .update({
        payment_status: 'failed',
        admin_notes: `Paiement refusé - Méthode: ${webhookData.paymentMethod} - Opérateur: ${webhookData.operatorId || 'N/A'}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (orderError) {
      throw new Error(`Erreur mise à jour commande: ${orderError.message}`)
    }

    // Notification du client (optionnel)
    await sendPaymentFailureEmail(orderData, webhookData)

    console.log(`Paiement refusé traité pour commande ${orderData.order_number}`)

  } catch (error) {
    console.error('Erreur traitement paiement refusé:', error)
    throw error
  }
}

/**
 * Traiter un paiement annulé
 */
async function handlePaymentCancelled(supabase, orderId, orderData, webhookData) {
  try {
    console.log(`Traitement paiement annulé pour commande ${orderData.order_number}`)

    const { error: orderError } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        payment_status: 'cancelled',
        admin_notes: `Paiement annulé par l'utilisateur - Méthode: ${webhookData.paymentMethod}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (orderError) {
      throw new Error(`Erreur mise à jour commande: ${orderError.message}`)
    }

    console.log(`Paiement annulé traité pour commande ${orderData.order_number}`)

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