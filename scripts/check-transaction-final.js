#!/usr/bin/env node

/**
 * Vérifier le statut final de la transaction après le webhook
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const TRANSACTION_ID = "OKIT1756559517884PAZMYEJN"

async function checkTransactionFinal() {
  try {
    console.log('🔍 VÉRIFICATION TRANSACTION FINALE')
    console.log('=' .repeat(40))
    console.log('')
    
    // Se connecter à Supabase avec SERVICE_ROLE_KEY
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // 1. Vérifier la transaction
    console.log(`📄 Transaction: ${TRANSACTION_ID}`)
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('transaction_id', TRANSACTION_ID)
      .single()

    if (transactionError) {
      console.log('❌ Erreur transaction:', transactionError.message)
      return
    }

    if (!transaction) {
      console.log('❌ Transaction non trouvée')
      return
    }

    console.log('✅ Transaction trouvée:')
    console.log('   - Statut:', transaction.status)
    console.log('   - Montant:', transaction.amount, transaction.currency)
    console.log('   - Créée:', transaction.created_at)
    console.log('   - Complétée:', transaction.completed_at || 'Non')
    console.log('')

    // 2. Vérifier les commandes liées
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('payment_transaction_id', transaction.id)

    if (ordersError) {
      console.log('❌ Erreur commandes:', ordersError.message)
    } else if (orders && orders.length > 0) {
      console.log('🛒 Commandes créées:')
      orders.forEach((order, index) => {
        console.log(`   ${index + 1}. ID: ${order.id}`)
        console.log(`      - Statut: ${order.status}`)
        console.log(`      - Total: ${order.total_cdf} CDF`)
        console.log(`      - Créée: ${order.created_at}`)
      })
      console.log('')

      // 3. Vérifier les items de commande
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orders.map(o => o.id))

      if (itemsError) {
        console.log('❌ Erreur items:', itemsError.message)
      } else if (items && items.length > 0) {
        console.log('📦 Items de commande:')
        items.forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.service_name} (${item.platform_name})`)
          console.log(`      - Quantité: ${item.quantity}`)
          console.log(`      - Total: ${item.total_cdf} CDF`)
          console.log(`      - Statut: ${item.status}`)
        })
      } else {
        console.log('⚠️  Aucun item de commande trouvé')
      }
    } else {
      console.log('⚠️  Aucune commande trouvée pour cette transaction')
    }

    console.log('')
    console.log('🎯 RÉSUMÉ:')
    console.log(`   - Transaction: ${transaction.status}`)
    console.log(`   - Commandes: ${orders?.length || 0}`)
    console.log(`   - Items: ${orders?.length > 0 ? 'À vérifier' : 'Aucun'}`)

  } catch (error) {
    console.error('❌ Erreur script:', error.message)
  }
}

checkTransactionFinal().catch(console.error)
