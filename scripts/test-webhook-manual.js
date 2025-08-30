#!/usr/bin/env node

/**
 * Test manuel du webhook CinetPay avec une vraie transaction
 */

require('dotenv').config({ path: '.env.local' })

// Utiliser une vraie transaction ID de votre base (vue dans les logs Vercel)
const REAL_TRANSACTION_ID = "OKIT1756559517884PAZMYEJN" // Transaction du paiement réel récent

async function testWebhookManual() {
  try {
    console.log('🧪 TEST MANUEL DU WEBHOOK CINETPAY')
    console.log('=' .repeat(50))
    console.log('')

    const webhookUrl = 'https://okit-boost.vercel.app/api/webhooks/cinetpay'
    console.log(`URL du webhook: ${webhookUrl}`)
    console.log(`Transaction ID: ${REAL_TRANSACTION_ID}`)
    console.log('')

    // Simuler un webhook CinetPay de succès EXACTEMENT comme reçu dans les logs
    // CinetPay V4 envoie "cpm_error_message: SUCCES"
    const webhookData = {
      cpm_site_id: process.env.CINETPAY_SITE_ID || "105905501",
      cpm_trans_id: REAL_TRANSACTION_ID,
      cpm_trans_date: "2025-08-30 13:11:58",
      cpm_amount: "100",
      cpm_currency: "CDF",
      signature: "06be15cb34c02bcd8fab20898aecf9ecbceda3d83f6dcf38812b1eae53c9cffe462858",
      payment_method: "OMCD",
      cel_phone_num: "0854262383",
      cpm_phone_prefixe: "243",
      cpm_language: "fr",
      cpm_version: "V4",
      cpm_payment_config: "SINGLE",
      cpm_page_action: "PAYMENT",
      cpm_custom: '{"userId":"e7d7d114-a50d-40b5-a313-e112e10bc033","timestamp":"2025-08-30T13:11:58.023Z","version":"2.0"}',
      cpm_designation: "Commande Okit-Boost - 1 services",
      cpm_error_message: "SUCCES"  // LE VRAI INDICATEUR DE SUCCÈS
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
