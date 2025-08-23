import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"
import { cinetPayService } from "@/lib/services/cinetpay"
import { validateCinetpayConfig } from "@/lib/config/cinetpay"

/**
 * Créer un lien de paiement CinetPay
 */
export async function POST(request) {
  let supabase
  let transactionRecord = null

  try {
    // Validation de la configuration
    validateCinetpayConfig()
    supabase = await createClient()
    
    // Vérification de l'authentification
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentification requise' }, 
        { status: 401 }
      )
    }

    const requestData = await request.json()
    const { orderId, paymentMethod, customerData } = requestData

    // Validation des données de base
    if (!orderId || !paymentMethod) {
      return NextResponse.json(
        { error: 'ID de commande et méthode de paiement requis' },
        { status: 400 }
      )
    }

    // Récupération de la commande avec vérification de propriété
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          services (name, platform_id)
        )
      `)
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Commande non trouvée ou accès refusé' },
        { status: 404 }
      )
    }

    // Vérification de l'état de la commande
    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: `Cette commande ne peut plus être payée (statut: ${order.status})` },
        { status: 400 }
      )
    }

    // Vérification qu'il n'y a pas déjà une transaction en cours
    const { data: existingTransaction } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('order_id', orderId)
      .in('status', ['pending', 'PENDING'])
      .single()

    if (existingTransaction) {
      return NextResponse.json(
        { 
          error: 'Une transaction est déjà en cours pour cette commande',
          existingTransactionId: existingTransaction.transaction_id
        },
        { status: 409 }
      )
    }

    // Génération de l'ID de transaction unique
    const transactionId = cinetPayService.generateTransactionId()

    // Préparation des données client avec fallback sur la commande
    const finalCustomerData = {
      customerName: customerData?.name || order.customer_name,
      customerEmail: customerData?.email || order.customer_email,
      customerPhone: customerData?.phone || order.customer_phone,
      customerAddress: customerData?.address || '',
      customerCity: customerData?.city || 'Kinshasa',
      customerCountry: 'CD'
    }

    // Préparation des données de paiement
    const paymentData = {
      transactionId,
      amount: order.currency === 'USD' ? Math.round(order.total_usd * 100) / 100 : order.total_cdf, // Arrondi pour USD
      currency: order.currency,
      description: `Commande ${order.order_number} - ${order.order_items.length} service(s)`,
      ...finalCustomerData,
      channels: cinetPayService.getOptimizedChannels(paymentMethod, 'CD'),
      metadata: {
        orderId: order.id,
        orderNumber: order.order_number,
        userId: user.id,
        paymentMethod: paymentMethod
      }
    }

    console.log('Création du paiement CinetPay:', JSON.stringify(paymentData, null, 2))

    // Validation des données avant création
    cinetPayService.validatePaymentData(paymentData)

    // Création de l'enregistrement de transaction en base (transaction DB)
    await supabase.rpc('begin_transaction')
    
    try {
      const { data: transaction, error: transactionError } = await supabase
        .from('payment_transactions')
        .insert({
          order_id: order.id,
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
        throw new Error(`Erreur création transaction: ${transactionError.message}`)
      }

      transactionRecord = transaction

      // Création du lien de paiement CinetPay
      const paymentResult = await cinetPayService.createPaymentLink(paymentData)

      // Mise à jour avec les informations CinetPay
      const { error: updateError } = await supabase
        .from('payment_transactions')
        .update({
          payment_token: paymentResult.paymentToken,
          provider_response: JSON.stringify(paymentResult),
          expires_at: paymentResult.expiresAt,
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.id)

      if (updateError) {
        throw new Error(`Erreur mise à jour transaction: ${updateError.message}`)
      }

      // Mise à jour de la commande
      await supabase
        .from('orders')
        .update({
          payment_transaction_id: transactionId,
          payment_method: paymentMethod,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id)

      await supabase.rpc('commit_transaction')

      // Log de succès
      console.log(`Paiement CinetPay créé avec succès: ${transactionId}`)

      return NextResponse.json({
        success: true,
        transactionId: transactionId,
        paymentUrl: paymentResult.paymentUrl,
        paymentToken: paymentResult.paymentToken,
        expiresAt: paymentResult.expiresAt,
        amount: paymentData.amount,
        currency: paymentData.currency,
        orderNumber: order.order_number
      })

    } catch (error) {
    console.error('Erreur vérification statut paiement:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la vérification du statut',
        code: 'STATUS_CHECK_FAILED',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}catch (error) {
  console.error('Erreur création paiement:', error)
  return NextResponse.json(
    { error: 'Erreur lors de la création du paiement' },
    { status: 500 }
  )
}

}

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
 * Vérifier le statut d'une transaction
 */
export async function GET(request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('transactionId')
    const userId = searchParams.get('userId')

    if (!transactionId) {
      return NextResponse.json(
        { error: 'ID de transaction requis' },
        { status: 400 }
      )
    }

    // Construction de la requête avec filtrage optionnel par utilisateur
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

    const { data: transaction, error: transactionError } = await query.single()

    if (transactionError || !transaction) {
      return NextResponse.json(
        { error: 'Transaction non trouvée' },
        { status: 404 }
      )
    }

    try {
      // Vérification du statut auprès de CinetPay si la transaction est encore en attente
      let currentStatus = transaction.status
      let statusResult = null

      if (['pending', 'PENDING'].includes(transaction.status)) {
        console.log(`Vérification du statut CinetPay pour: ${transactionId}`)
        
        statusResult = await cinetPayService.checkTransactionStatus(
          transactionId, 
          transaction.payment_token
        )

        currentStatus = statusResult.status
        
        // Mise à jour en base si le statut a changé
        if (statusResult.status !== transaction.status) {
          console.log(`Mise à jour du statut: ${transaction.status} → ${statusResult.status}`)
          
          const updateData = {
            status: statusResult.status,
            provider_response: JSON.stringify(statusResult),
            updated_at: new Date().toISOString()
          }

          // Si le paiement est accepté, marquer comme complété
          if (statusResult.status === 'ACCEPTED') {
            updateData.completed_at = new Date().toISOString()
          }

          await supabase
            .from('payment_transactions')
            .update(updateData)
            .eq('id', transaction.id)

          // Mise à jour du statut de la commande
          await updateOrderStatus(supabase, transaction.order_id, statusResult.status)
        }
      }

      return NextResponse.json({
        success: true,
        transactionId,
        status: currentStatus,
        amount: transaction.amount,
        currency: transaction.currency,
        paymentMethod: transaction.payment_method,
        paymentDate: statusResult?.paymentDate || transaction.completed_at,
        customerPhone: statusResult?.customerPhone || transaction.customer_phone,
        order: {
          id: transaction.orders.id,
          orderNumber: transaction.orders.order_number,
          status: transaction.orders.status,
          customerName: transaction.orders.customer_name
        },
        lastChecked: new Date().toISOString()
      })

    } catch (cinetpayError) {
      console.error('Erreur vérification CinetPay:', cinetpayError)
      
      // Retourner les données de base même si CinetPay ne répond pas
      return NextResponse.json({
        success: true,
        transactionId,
        status: transaction.status,
        amount: transaction.amount,
        currency: transaction.currency,
        paymentMethod: transaction.payment_method,
        order: {
          id: transaction.orders.id,
          orderNumber: transaction.orders.order_number,
          status: transaction.orders.status
        },
        warning: 'Impossible de vérifier le statut auprès de CinetPay',
        lastChecked: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('Erreur vérification statut paiement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la vérification du statut' },
      { status: 500 }
    )
  }
}