// src/app/api/webhooks/cinetpay/route.js
import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"
import { cinetPayService } from "@/lib/services/cinetpay"

export async function POST(request) {
  try {
    const supabase = await createClient()
    const payload = await request.json()

    console.log('Webhook CinetPay reçu:', payload)

    // Traiter la notification
    const webhookData = cinetPayService.processWebhookNotification(payload)

    if (!webhookData) {
      return NextResponse.json(
        { error: 'Données webhook invalides' },
        { status: 400 }
      )
    }

    // Récupérer la transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .select(`
        *,
        orders (*)
      `)
      .eq('transaction_id', webhookData.transactionId)
      .single()

    if (transactionError || !transaction) {
      console.error('Transaction non trouvée:', webhookData.transactionId)
      return NextResponse.json(
        { error: 'Transaction non trouvée' },
        { status: 404 }
      )
    }

    // Éviter le traitement de doublons
    if (transaction.status === webhookData.status) {
      return NextResponse.json({ success: true, message: 'Déjà traité' })
    }

    // Mettre à jour la transaction
    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({
        status: webhookData.status,
        provider_response: JSON.stringify(webhookData),
        completed_at: webhookData.status === 'ACCEPTED' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.id)

    if (updateError) {
      console.error('Erreur mise à jour transaction:', updateError)
      throw new Error('Erreur mise à jour transaction')
    }

    // Traitement selon le statut
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
        console.log('Statut webhook non géré:', webhookData.status)
    }

    // Enregistrer l'événement webhook pour audit
    await supabase
      .from('webhook_events')
      .insert({
        provider: 'cinetpay',
        event_type: 'payment_notification',
        transaction_id: webhookData.transactionId,
        status: webhookData.status,
        payload: JSON.stringify(payload),
        processed_at: new Date().toISOString()
      })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erreur traitement webhook CinetPay:', error)
    
    // Log l'erreur pour debugging
    try {
      const supabase = await createClient()
      await supabase
        .from('webhook_events')
        .insert({
          provider: 'cinetpay',
          event_type: 'payment_notification_error',
          payload: JSON.stringify(await request.json()),
          error_message: error.message,
          processed_at: new Date().toISOString()
        })
    } catch (logError) {
      console.error('Erreur log webhook:', logError)
    }

    return NextResponse.json(
      { error: 'Erreur traitement webhook' },
      { status: 500 }
    )
  }
}

async function handlePaymentAccepted(supabase, transaction, webhookData) {
  try {
    // Mettre à jour le statut de la commande
    const { error: orderError } = await supabase
      .from('orders')
      .update({
        status: 'processing',
        payment_status: 'paid',
        payment_method: webhookData.paymentMethod,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.order_id)

    if (orderError) {
      throw new Error('Erreur mise à jour commande')
    }

    // Envoyer notification email au client (optionnel)
    await sendPaymentConfirmationEmail(transaction.orders, webhookData)

    // Notification administrateur
    await notifyAdminNewPayment(transaction.orders, webhookData)

    console.log(`Paiement accepté pour commande ${transaction.orders.order_number}`)
  } catch (error) {
    console.error('Erreur traitement paiement accepté:', error)
    throw error
  }
}

async function handlePaymentRefused(supabase, transaction, webhookData) {
  try {
    // Mettre à jour le statut de la commande
    await supabase
      .from('orders')
      .update({
        payment_status: 'failed',
        admin_notes: `Paiement refusé - ${webhookData.paymentMethod}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.order_id)

    console.log(`Paiement refusé pour commande ${transaction.orders.order_number}`)
  } catch (error) {
    console.error('Erreur traitement paiement refusé:', error)
    throw error
  }
}

async function handlePaymentCancelled(supabase, transaction, webhookData) {
  try {
    // Mettre à jour le statut de la commande
    await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        payment_status: 'cancelled',
        admin_notes: `Paiement annulé par l'utilisateur`,
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.order_id)

    console.log(`Paiement annulé pour commande ${transaction.orders.order_number}`)
  } catch (error) {
    console.error('Erreur traitement paiement annulé:', error)
    throw error
  }
}

// Fonctions de notification (à implémenter selon vos besoins)
async function sendPaymentConfirmationEmail(order, webhookData) {
  // Implémentation de l'envoi d'email de confirmation
  console.log('Envoi email confirmation paiement:', order.order_number)
}

async function notifyAdminNewPayment(order, webhookData) {
  // Notification pour les administrateurs
  console.log('Notification admin nouveau paiement:', order.order_number)
}

// Endpoint GET pour vérifier le webhook
export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: 'Webhook CinetPay endpoint actif',
    timestamp: new Date().toISOString()
  })
}