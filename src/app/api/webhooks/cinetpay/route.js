/**
 * Webhook CinetPay - Traitement des notifications de paiement
 * 
 * Ce webhook reçoit les notifications de CinetPay quand un paiement change de statut.
 * Il met à jour la transaction et crée automatiquement les commandes pour les paiements acceptés.
 */

import { createAdminClient } from "@/utils/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

/**
 * Gestionnaire GET pour vérifier que le webhook est accessible
 */
export async function GET(request) {
  return NextResponse.json({
    status: 'webhook_accessible',
    method: 'GET',
    timestamp: new Date().toISOString(),
    message: 'CinetPay webhook endpoint is accessible. Use POST for notifications.'
  })
}

/**
 * Gestionnaire principal du webhook CinetPay
 */
export async function POST(request) {
  const startTime = Date.now()
  
  try {
    // 1. Récupération et validation du payload 
    // CinetPay envoie les données en application/x-www-form-urlencoded
    let payload = {}
    
    try {
      // D'abord, récupérer le contenu brut
      const contentType = request.headers.get('content-type') || ''
      
      if (contentType.includes('application/x-www-form-urlencoded')) {
        // Traiter comme form-encoded
        const text = await request.text()
        
        const params = new URLSearchParams(text)
        for (const [key, value] of params.entries()) {
          payload[key] = value
        }
      } else if (contentType.includes('multipart/form-data')) {
        // Traiter comme FormData
        const formData = await request.formData()
        for (const [key, value] of formData.entries()) {
          payload[key] = value
        }
      } else {
        // Essayer JSON en fallback
        const text = await request.text()
        
        if (text.trim().startsWith('{')) {
          payload = JSON.parse(text)
        } else {
          // Dernière tentative: form-encoded sans content-type
          const params = new URLSearchParams(text)
          for (const [key, value] of params.entries()) {
            payload[key] = value
          }
        }
      }
    } catch (parseError) {
      console.error('Error parsing webhook body:', parseError.message)
      return NextResponse.json(
        { error: 'Impossible de parser le body de la requête', details: parseError.message }, 
        { status: 400 }
      )
    }
    
    
    if (!payload.cpm_trans_id) {
      return NextResponse.json(
        { error: 'Transaction ID manquant', receivedKeys: Object.keys(payload) }, 
        { status: 400 }
      )
    }

    // 2. Initialisation Supabase avec les permissions administrateur
    const supabase = await createAdminClient()


    // 3. Extraction des données du webhook
    const transactionId = payload.cpm_trans_id
    
    // Déterminer le statut du paiement basé sur cpm_result
    let paymentStatus = payload.cpm_trans_status || payload.cpm_trans_status
    
    // CinetPay utilise différents indicateurs selon la version :
    // - cpm_result: "00" (ancienne version)  
    // - cpm_error_message: "SUCCES" (nouvelle version V4)

    
    if (!paymentStatus) {
      if (payload.cpm_result === "00") {
        paymentStatus = "ACCEPTED"
   
      } else if (payload.cpm_error_message === "SUCCES") {
        paymentStatus = "ACCEPTED" 
      } else if (payload.cpm_result && payload.cpm_result !== "00") {
        paymentStatus = "REFUSED"
      } else if (payload.cpm_error_message && payload.cpm_error_message !== "SUCCES") {
        paymentStatus = "REFUSED"
      } else {
        console.log('⚠️  Aucun indicateur de statut reconnu')
      }
    }
    
    // 4. Récupération de la transaction existante
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('transaction_id', transactionId)
      .single()

    if (transactionError || !transaction) {
      return NextResponse.json(
        { error: 'Transaction non trouvée' },
        { status: 404 }
      )
    }

   
    if (paymentStatus === 'ACCEPTED' && transaction.status !== 'completed') {
      await processSuccessfulPayment(supabase, transaction, transactionId)

      return NextResponse.json({
        success: true,
        message: 'Paiement traité et commande créée',
        transactionId: transactionId,
        processingTime: Date.now() - startTime
      })
    } else {
      console.log('⚠️  Paiement non traité:', {
        reason: paymentStatus !== 'ACCEPTED' ? 'Statut pas ACCEPTED' : 'Transaction déjà completed'
      })
    }

    // 6. Autres statuts ou transaction déjà traitée
    return NextResponse.json({
      success: true,
      message: 'Webhook traité',
      status: paymentStatus,
      alreadyProcessed: transaction.status === 'completed'
    })

  } catch (error) {
    console.error('Erreur webhook CinetPay:', error)
    
    return NextResponse.json(
      { 
        error: 'Erreur interne du webhook',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * Traite un paiement réussi : met à jour la transaction et crée la commande
 */
async function processSuccessfulPayment(supabase, transaction, transactionId) {
  try {
    // 1. Mettre à jour le statut de la transaction
    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('transaction_id', transactionId)

    if (updateError) {
      throw new Error(`Erreur mise à jour transaction: ${updateError.message}`)
    }

    // 2. Récupérer les métadonnées de la commande
    const metadata = JSON.parse(transaction.metadata || '{}')
    
    // 3. Créer la commande principale
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: transaction.user_id,
        total_usd: parseFloat(metadata.totalUSD || transaction.amount / 1667),
        total_cdf: parseInt(metadata.totalCDF || transaction.amount),
        currency: metadata.currency || transaction.currency,
        customer_name: transaction.customer_name || 'Client',
        customer_email: transaction.customer_email,
        customer_phone: transaction.customer_phone?.toString() || '',
        payment_method: metadata.paymentMethod || 'mobile_money',
        payment_transaction_id: transaction.transaction_id,
        status: 'pending',
        admin_notes: 'Commande créée automatiquement via CinetPay'
      })
      .select()
      .single()

    if (orderError) {
      throw new Error(`Erreur création commande: ${orderError.message}`)
    }

    // 4. Créer les articles de la commande
    const cartItems = metadata.cartItems || []
    if (cartItems.length > 0) {
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        service_id: item.service_id,
        service_name: item.service_name || 'Service',
        platform_name: item.platform_name || item.platform_id || 'Inconnu',
        target_link: item.target_link,
        quantity: parseInt(item.quantity),
        price_usd: parseFloat(item.price_usd || 0),
        price_cdf: parseInt(item.price_cdf || 0),
        total_usd: parseFloat(item.total_usd || 0),
        total_cdf: parseInt(item.total_cdf || 0),
        status: 'pending'
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        console.error('Erreur création articles commande:', itemsError.message)
      }
    }

    // 5. Lier la commande à la transaction
    await supabase
      .from('payment_transactions')
      .update({ order_id: order.id })
      .eq('transaction_id', transactionId)

  } catch (error) {
    console.error('Erreur traitement paiement réussi:', error)
    throw error
  }
}