// #!/usr/bin/env node

// /**
//  * Script utilitaire pour vérifier le statut d'un paiement
//  * Usage: node scripts/check-payment-status.js <transaction_id>
//  */

// const { createClient } = require('@supabase/supabase-js')
// require('dotenv').config({ path: '.env.local' })

// const transactionId = process.argv[2]

// if (!transactionId) {
//   console.log('Usage: node scripts/check-payment-status.js <transaction_id>')
//   process.exit(1)
// }

// async function checkPaymentStatus() {
//   try {
//     // Initialiser Supabase
//     const supabase = createClient(
//       process.env.NEXT_PUBLIC_SUPABASE_URL,
//       process.env.SUPABASE_SERVICE_ROLE_KEY
//     )

//     // Récupérer la transaction avec la commande liée
//     const { data: transaction, error: transactionError } = await supabase
//       .from('payment_transactions')
//       .select(`
//         *,
//         orders (
//           id,
//           status,
//           total_usd,
//           total_cdf,
//           created_at,
//           order_items (
//             id,
//             service_name,
//             quantity,
//             status
//           )
//         )
//       `)
//       .eq('transaction_id', transactionId)
//       .single()

//     if (transactionError) {
//       console.error('Erreur:', transactionError.message)
//       return
//     }

//     if (!transaction) {
//       console.log('❌ Transaction non trouvée:', transactionId)
//       return
//     }

//     // Afficher les informations
//     console.log('\n📊 STATUT PAIEMENT')
//     console.log('═'.repeat(50))
//     console.log('Transaction ID:', transaction.transaction_id)
//     console.log('Statut:', transaction.status)
//     console.log('Montant:', transaction.amount, transaction.currency)
//     console.log('Client:', transaction.customer_email)
//     console.log('Créé le:', new Date(transaction.created_at).toLocaleString())
    
//     if (transaction.completed_at) {
//       console.log('Complété le:', new Date(transaction.completed_at).toLocaleString())
//     }

//     if (transaction.orders) {
//       console.log('\n📦 COMMANDE ASSOCIÉE')
//       console.log('─'.repeat(30))
//       console.log('Commande ID:', transaction.orders.id)
//       console.log('Statut commande:', transaction.orders.status)
//       console.log('Total:', transaction.orders.total_usd, 'USD /', transaction.orders.total_cdf, 'CDF')
//       console.log('Articles:', transaction.orders.order_items?.length || 0)
      
//       if (transaction.orders.order_items?.length > 0) {
//         console.log('\n📋 ARTICLES:')
//         transaction.orders.order_items.forEach((item, index) => {
//           console.log(`  ${index + 1}. ${item.service_name} (${item.quantity}x) - ${item.status}`)
//         })
//       }
//     } else {
//       console.log('\n❌ Aucune commande associée')
//     }

//     console.log('\n')

//   } catch (error) {
//     console.error('Erreur script:', error.message)
//   }
// }

// checkPaymentStatus()
