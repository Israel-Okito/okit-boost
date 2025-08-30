import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { errorHandler } from '@/lib/errors/errorHandler'
import { logger } from '@/lib/errors/logger'

export async function GET(request) {
  return errorHandler.safeExecute(async () => {
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('transactionId')

    if (!transactionId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Transaction ID requis',
          code: 'MISSING_TRANSACTION_ID'
        },
        { status: 400 }
      )
    }

    // Utiliser SERVICE KEY pour accéder aux transactions
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Rechercher la transaction dans la base de données
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .select(`
        *,
        orders (
          id,
          status,
          total_usd,
          total_cdf,
          currency,
          created_at,
          order_items (
            id,
            service_name,
            platform_name,
            quantity,
            total_usd,
            total_cdf,
            status
          )
        )
      `)
      .eq('transaction_id', transactionId)
      .single()

    if (transactionError || !transaction) {
      logger.warn(`Transaction non trouvée: ${transactionId}`, { 
        error: transactionError,
        transactionId 
      })
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Transaction non trouvée',
          code: 'TRANSACTION_NOT_FOUND',
          transactionId
        },
        { status: 404 }
      )
    }

    // Déterminer le statut final
    const isSuccess = transaction.status === 'completed' || transaction.status === 'accepted'
    const isPending = transaction.status === 'pending'
    const isFailed = transaction.status === 'failed' || transaction.status === 'refused' || transaction.status === 'cancelled'

    const response = {
      success: true,
      transaction: {
        id: transaction.transaction_id,
        status: transaction.status,
        amount: transaction.amount,
        currency: transaction.currency,
        paymentMethod: transaction.payment_method,
        createdAt: transaction.created_at,
        completedAt: transaction.completed_at,
        customerEmail: transaction.customer_email,
        customerPhone: transaction.customer_phone,
        customerName: transaction.customer_name
      },
      order: transaction.orders ? {
        id: transaction.orders.id,
        status: transaction.orders.status,
        total: {
          usd: transaction.orders.total_usd,
          cdf: transaction.orders.total_cdf,
          currency: transaction.orders.currency
        },
        items: transaction.orders.order_items || [],
        createdAt: transaction.orders.created_at
      } : null,
      status: {
        isSuccess,
        isPending,
        isFailed,
        message: getStatusMessage(transaction.status),
        nextAction: getNextAction(transaction.status)
      }
    }

    logger.info(`Statut transaction récupéré: ${transactionId}`, {
      status: transaction.status,
      hasOrder: !!transaction.orders,
      itemsCount: transaction.orders?.order_items?.length || 0
    })

    return NextResponse.json(response)

  }, {
    operation: 'GET_PAYMENT_STATUS',
    useCircuitBreaker: false,
    logErrors: true
  })
}

function getStatusMessage(status) {
  const messages = {
    'pending': 'Paiement en cours de traitement...',
    'completed': 'Paiement réussi ! Votre commande a été créée.',
    'accepted': 'Paiement accepté ! Votre commande est en cours de traitement.',
    'failed': 'Échec du paiement. Veuillez réessayer.',
    'refused': 'Paiement refusé. Vérifiez vos informations.',
    'cancelled': 'Paiement annulé par l\'utilisateur.',
    'expired': 'Le lien de paiement a expiré.'
  }
  
  return messages[status] || 'Statut de paiement inconnu'
}

function getNextAction(status) {
  const actions = {
    'pending': 'wait',
    'completed': 'redirect_to_orders',
    'accepted': 'redirect_to_orders', 
    'failed': 'retry_payment',
    'refused': 'retry_payment',
    'cancelled': 'retry_payment',
    'expired': 'retry_payment'
  }
  
  return actions[status] || 'contact_support'
}

// Ajouter un handler POST pour éviter l'erreur 405
export async function POST(request) {
  return NextResponse.json(
    { 
      error: 'Méthode POST non supportée pour cette route. Utilisez GET.',
      allowedMethods: ['GET']
    },
    { status: 405 }
  )
}
