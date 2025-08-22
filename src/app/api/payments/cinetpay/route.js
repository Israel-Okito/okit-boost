// src/app/api/payments/cinetpay/route.js
import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"
import { cinetPayService } from "@/lib/services/cinetpay"
import { validateCinetpayConfig } from "@/lib/config/cinetpay"

export async function POST(request) {
  try {
    // Valider la configuration CinetPay
    validateCinetpayConfig()

    const supabase = await createClient()
    
    // Vérifier l'authentification
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { orderId, paymentMethod } = await request.json()

    if (!orderId || !paymentMethod) {
      return NextResponse.json(
        { error: 'ID de commande et méthode de paiement requis' },
        { status: 400 }
      )
    }

    // Récupérer la commande
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          services (name)
        )
      `)
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Commande non trouvée' },
        { status: 404 }
      )
    }

    // Vérifier que la commande peut être payée
    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: 'Cette commande ne peut plus être payée' },
        { status: 400 }
      )
    }

    // Générer un ID de transaction unique
    const transactionId = cinetPayService.generateTransactionId()

    // Préparer les données de paiement
    const paymentData = {
      transactionId,
      amount: order.currency === 'USD' ? order.total_usd : order.total_cdf,
      currency: order.currency,
      description: `Commande ${order.order_number} - ${order.order_items.length} service(s)`,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone.replace(/\s/g, ''),
      customerCountry: 'CD', // République Démocratique du Congo
      channels: cinetPayService.getPaymentChannels(paymentMethod, 'CD'),
      metadata: JSON.stringify({
        orderId: order.id,
        orderNumber: order.order_number,
        userId: user.id
      })
    }

    // Valider les données
    cinetPayService.validatePaymentData(paymentData)

    // Créer le lien de paiement
    const paymentResult = await cinetPayService.createPaymentLink(paymentData)

    // Enregistrer la transaction en base
    const { error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        order_id: order.id,
        user_id: user.id,
        transaction_id: transactionId,
        payment_token: paymentResult.paymentToken,
        amount: paymentData.amount,
        currency: paymentData.currency,
        payment_method: paymentMethod,
        status: 'pending',
        provider: 'cinetpay',
        provider_response: JSON.stringify(paymentResult)
      })

    if (transactionError) {
      console.error('Erreur enregistrement transaction:', transactionError)
      throw new Error('Erreur lors de l\'enregistrement de la transaction')
    }

    // Mettre à jour la commande avec l'ID de transaction
    await supabase
      .from('orders')
      .update({
        payment_transaction_id: transactionId,
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id)

    return NextResponse.json({
      success: true,
      paymentUrl: paymentResult.paymentUrl,
      transactionId: transactionId,
      paymentToken: paymentResult.paymentToken
    })

  } catch (error) {
    console.error('Erreur création paiement CinetPay:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Erreur lors de la création du paiement',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

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

    // Vérifier le statut de la transaction
    const statusResult = await cinetPayService.checkTransactionStatus(transactionId)

    // Récupérer la transaction en base
    let query = supabase
      .from('payment_transactions')
      .select(`
        *,
        orders (
          id,
          order_number,
          status,
          user_id
        )
      `)
      .eq('transaction_id', transactionId)

    // Filtrer par utilisateur si fourni
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

    // Mettre à jour le statut si nécessaire
    if (transaction.status !== statusResult.status) {
      await supabase
        .from('payment_transactions')
        .update({
          status: statusResult.status,
          provider_response: JSON.stringify(statusResult),
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.id)

      // Mettre à jour le statut de la commande si le paiement est accepté
      if (statusResult.status === 'ACCEPTED' && transaction.orders.status === 'pending') {
        await supabase
          .from('orders')
          .update({
            status: 'processing',
            payment_status: 'paid',
            updated_at: new Date().toISOString()
          })
          .eq('id', transaction.order_id)
      }
    }

    return NextResponse.json({
      success: true,
      transactionId,
      status: statusResult.status,
      amount: statusResult.amount,
      currency: statusResult.currency,
      paymentMethod: statusResult.payment_method,
      order: {
        id: transaction.orders.id,
        orderNumber: transaction.orders.order_number,
        status: transaction.orders.status
      }
    })

  } catch (error) {
    console.error('Erreur vérification statut paiement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la vérification du statut' },
      { status: 500 }
    )
  }
}