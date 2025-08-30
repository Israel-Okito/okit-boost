#!/usr/bin/env node

/**
 * Test manuel du webhook CinetPay avec une vraie transaction
 */

require('dotenv').config({ path: '.env.local' })

// Utiliser une vraie transaction ID de votre base (vue dans les logs Vercel)
const REAL_TRANSACTION_ID = "OKIT1756507623017THOHCO1A" // Transaction trouvée dans les logs

async function testWebhookManual() {
  try {
    console.log('🧪 TEST MANUEL DU WEBHOOK CINETPAY')
    console.log('=' .repeat(50))
    console.log('')

    const webhookUrl = 'https://okit-boost.vercel.app/api/webhooks/cinetpay'
    console.log(`URL du webhook: ${webhookUrl}`)
    console.log(`Transaction ID: ${REAL_TRANSACTION_ID}`)
    console.log('')

    // Simuler un webhook CinetPay de succès
    // CinetPay envoie en application/x-www-form-urlencoded
    const webhookData = {
      cpm_result: "00",           // Code succès CinetPay
      cpm_trans_id: REAL_TRANSACTION_ID,
      cpm_trans_date: new Date().toISOString().slice(0, 19).replace('T', ' '),
      cpm_site_id: process.env.CINETPAY_SITE_ID || "12345",
      cpm_amount: "100",
      cpm_currency: "CDF",
      signature: "manual-completion-signature" // Signature de test pour development
    }

    // Convertir en FormData pour simuler exactement CinetPay
    const formData = new URLSearchParams()
    Object.entries(webhookData).forEach(([key, value]) => {
      formData.append(key, value)
    })

    console.log('📡 Envoi du webhook (format CinetPay)...')
    console.log('Données:', Object.fromEntries(formData.entries()))
    console.log('')

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'CinetPay-Webhook-Simulator'
      },
      body: formData.toString()
    })

    console.log(`Status: ${response.status} ${response.statusText}`)
    
    if (response.ok) {
      const result = await response.text()
      console.log('✅ WEBHOOK TRAITÉ AVEC SUCCÈS')
      console.log('Réponse:', result)
      
      console.log('')
      console.log('🔍 Vérification dans la base de données...')
      console.log(`Allez vérifier si la transaction ${REAL_TRANSACTION_ID} est maintenant "completed"`)
      
    } else {
      const error = await response.text()
      console.log('❌ ERREUR WEBHOOK')
      console.log('Réponse:', error)
    }

    console.log('')
    console.log('🎯 PROCHAINES ÉTAPES:')
    console.log('1. Vérifiez la transaction dans votre base de données')
    console.log('2. Vérifiez si une commande a été créée')
    console.log('3. Testez un vrai paiement CinetPay')

  } catch (error) {
    console.error('❌ Erreur:', error.message)
  }
}

testWebhookManual().catch(console.error)
