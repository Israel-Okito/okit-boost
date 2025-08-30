#!/usr/bin/env node

/**
 * Test avec une nouvelle transaction pour voir les logs de production
 */

require('dotenv').config({ path: '.env.local' })

async function testNewTransaction() {
  try {
    console.log('🧪 TEST NOUVELLE TRANSACTION PRODUCTION')
    console.log('=' .repeat(45))
    console.log('')

    // Utiliser un ID de transaction totalement nouveau
    const newTransactionId = `OKIT${Date.now()}TEST${Math.random().toString(36).substr(2, 5).toUpperCase()}`
    
    const webhookUrl = 'https://okit-boost.vercel.app/api/webhooks/cinetpay'
    console.log(`URL du webhook: ${webhookUrl}`)
    console.log(`Transaction ID: ${newTransactionId}`)
    console.log('')

    // Données webhook avec nouvelle transaction
    const webhookData = {
      cpm_site_id: "105905501",
      cpm_trans_id: newTransactionId,
      cpm_trans_date: new Date().toISOString().slice(0, 19).replace('T', ' '),
      cpm_amount: "100",
      cpm_currency: "CDF",
      signature: "test-signature-" + Date.now(),
      payment_method: "OMCD",
      cel_phone_num: "0854262383",
      cpm_phone_prefixe: "243",
      cpm_language: "fr",
      cpm_version: "V4",
      cpm_payment_config: "SINGLE",
      cpm_page_action: "PAYMENT",
      cpm_custom: JSON.stringify({
        userId: "test-user-id",
        timestamp: new Date().toISOString(),
        version: "2.0"
      }),
      cpm_designation: "Test Commande Okit-Boost - 1 services",
      cpm_error_message: "SUCCES"  // L'indicateur de succès
    }

    const formData = new URLSearchParams()
    Object.entries(webhookData).forEach(([key, value]) => {
      formData.append(key, value)
    })

    console.log('📡 Envoi du webhook (nouvelle transaction)...')
    console.log('Données clés:', {
      cpm_trans_id: webhookData.cpm_trans_id,
      cpm_error_message: webhookData.cpm_error_message,
      cpm_amount: webhookData.cmp_amount
    })
    console.log('')

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'CinetPay-Webhook-Test-New'
      },
      body: formData.toString()
    })

    console.log(`Status: ${response.status} ${response.statusText}`)
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ WEBHOOK TRAITÉ')
      console.log('Réponse:', JSON.stringify(result, null, 2))
    } else {
      const text = await response.text()
      console.log('❌ ERREUR WEBHOOK')
      console.log('Réponse:', text)
    }

    console.log('')
    console.log('🔍 Vérifiez les logs Vercel pour voir:')
    console.log('   - Le parsing des données')
    console.log('   - La détection du statut')
    console.log('   - Si la transaction est créée ou mise à jour')

  } catch (error) {
    console.error('❌ Erreur script:', error.message)
  }
}

testNewTransaction().catch(console.error)
