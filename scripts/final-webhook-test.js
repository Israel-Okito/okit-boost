#!/usr/bin/env node

/**
 * Test final du webhook avec diagnostic complet
 */

require('dotenv').config({ path: '.env.local' })

const TRANSACTION_ID = "OKIT1756559517884PAZMYEJN"

async function finalWebhookTest() {
  try {
    console.log('🧪 TEST FINAL WEBHOOK + DIAGNOSTIC')
    console.log('=' .repeat(45))
    console.log('')

    // 1. Test du webhook
    const webhookUrl = 'https://okit-boost.vercel.app/api/webhooks/cinetpay'
    const webhookData = {
      cpm_site_id: "105905501",
      cpm_trans_id: TRANSACTION_ID,
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
      cpm_error_message: "SUCCES"
    }

    const formData = new URLSearchParams()
    Object.entries(webhookData).forEach(([key, value]) => {
      formData.append(key, value)
    })

    console.log('📡 ÉTAPE 1: Test webhook...')
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'CinetPay-Final-Test'
      },
      body: formData.toString()
    })

    console.log(`   Status: ${response.status} ${response.statusText}`)
    
    if (response.ok) {
      const result = await response.json()
      console.log('   ✅ Webhook réussi')
      console.log('   Réponse:', JSON.stringify(result, null, 2))
    } else {
      const text = await response.text()
      console.log('   ❌ Webhook échoué')
      console.log('   Réponse:', text)
      return
    }

    console.log('')

    // 2. Attendre un peu pour que le traitement se termine
    console.log('⏳ ÉTAPE 2: Attente du traitement (3 secondes)...')
    await new Promise(resolve => setTimeout(resolve, 3000))

    // 3. Vérifier le statut via l'API
    console.log('🔍 ÉTAPE 3: Vérification via API status...')
    const statusUrl = `https://okit-boost.vercel.app/api/payments/cinetpay/status?transactionId=${TRANSACTION_ID}`
    
    try {
      const statusResponse = await fetch(statusUrl)
      console.log(`   Status API: ${statusResponse.status} ${statusResponse.statusText}`)
      
      if (statusResponse.ok) {
        const statusResult = await statusResponse.json()
        console.log('   ✅ API status accessible')
        console.log('   Statut transaction:', statusResult.transaction?.status)
        console.log('   Commande créée:', !!statusResult.order)
        console.log('   Message:', statusResult.status?.message)
      } else {
        console.log('   ❌ API status inaccessible')
      }
    } catch (statusError) {
      console.log('   ❌ Erreur API status:', statusError.message)
    }

    console.log('')

    // 4. Test page de succès
    console.log('🌐 ÉTAPE 4: Test page de succès...')
    const successUrl = `https://okit-boost.vercel.app/paiement/success?transaction_id=${TRANSACTION_ID}&token=test-token`
    
    try {
      const pageResponse = await fetch(successUrl)
      console.log(`   Page: ${pageResponse.status} ${pageResponse.statusText}`)
      
      if (pageResponse.ok) {
        console.log('   ✅ Page accessible')
      } else {
        console.log('   ❌ Page inaccessible')
      }
    } catch (pageError) {
      console.log('   ❌ Erreur page:', pageError.message)
    }

    console.log('')
    console.log('🎯 RÉSUMÉ:')
    console.log('   1. Webhook: Probablement OK (vérifiez les logs Vercel)')
    console.log('   2. API Status: À vérifier')
    console.log('   3. Page Succès: À vérifier')
    console.log('')
    console.log('📋 ACTIONS RECOMMANDÉES:')
    console.log('   • Vérifiez les logs Vercel pour les détails du webhook')
    console.log('   • Poussez le code vers GitHub quand la connexion est rétablie')
    console.log('   • Testez un nouveau vrai paiement après déploiement')

  } catch (error) {
    console.error('❌ Erreur script:', error.message)
  }
}

finalWebhookTest().catch(console.error)
