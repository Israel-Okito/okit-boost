#!/usr/bin/env node

/**
 * Vérification directe des commandes liées à la transaction
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const TRANSACTION_ID = "OKIT1756559517884PAZMYEJN"

async function checkOrdersDirect() {
  try {
    console.log('🔍 VÉRIFICATION DIRECTE DES COMMANDES')
    console.log('=' .repeat(40))
    console.log('')
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // 1. Récupérer la transaction avec son ID interne
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('transaction_id', TRANSACTION_ID)
      .single()

    if (transactionError || !transaction) {
      console.log('❌ Transaction non trouvée')
      return
    }

    console.log('✅ Transaction trouvée:')
    console.log('   - ID interne:', transaction.id)
    console.log('   - Transaction ID:', transaction.transaction_id)
    console.log('   - Statut:', transaction.status)
    console.log('   - Complétée:', transaction.completed_at)
    console.log('')

    // 2. Chercher les commandes avec l'ID interne
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('payment_transaction_id', transaction.id)

    if (ordersError) {
      console.log('❌ Erreur recherche commandes:', ordersError.message)
      return
    }

    console.log(`📋 Commandes trouvées: ${orders?.length || 0}`)
    if (orders && orders.length > 0) {
      orders.forEach((order, index) => {
        console.log(`   ${index + 1}. Commande ${order.id}`)
        console.log(`      - Statut: ${order.status}`)
        console.log(`      - Total: ${order.total_cdf} CDF`)
        console.log(`      - Créée: ${order.created_at}`)
      })
    }

    // 3. Chercher aussi par transaction_id directement
    const { data: ordersDirect, error: ordersDirectError } = await supabase
      .from('orders')
      .select('*')
      .eq('transaction_id', TRANSACTION_ID)

    if (!ordersDirectError && ordersDirect && ordersDirect.length > 0) {
      console.log('')
      console.log(`📋 Commandes (recherche directe): ${ordersDirect.length}`)
      ordersDirect.forEach((order, index) => {
        console.log(`   ${index + 1}. Commande ${order.id}`)
        console.log(`      - Statut: ${order.status}`)
        console.log(`      - Total: ${order.total_cdf} CDF`)
      })
    }

    // 4. Vérifier le revenu total
    const { data: revenue, error: revenueError } = await supabase
      .from('orders')
      .select('total_cdf')
      .eq('status', 'completed')

    if (!revenueError && revenue) {
      const totalRevenue = revenue.reduce((sum, order) => sum + (order.total_cdf || 0), 0)
      console.log('')
      console.log(`💰 Revenu total (toutes commandes completed): ${totalRevenue} CDF`)
    }

  } catch (error) {
    console.error('❌ Erreur script:', error.message)
  }
}

checkOrdersDirect().catch(console.error)
