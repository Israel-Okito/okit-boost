#!/usr/bin/env node

/**
 * Vérifier si le webhook est accessible en production
 */

async function checkWebhookProduction() {
  try {
    console.log('🔍 VÉRIFICATION WEBHOOK PRODUCTION')
    console.log('=' .repeat(40))
    console.log('')

    const baseUrl = 'https://okit-boost.vercel.app'
    const urls = [
      `${baseUrl}/api/webhooks/cinetpay`,
      `${baseUrl}/api/payments/cinetpay/status?transactionId=test`
    ]

    for (const url of urls) {
      console.log(`Testing: ${url}`)
      
      try {
        // Test GET pour voir si l'endpoint existe
        const response = await fetch(url, { method: 'GET' })
        console.log(`   GET: ${response.status} ${response.statusText}`)
        
        if (response.status === 405) {
          console.log('   ✅ Endpoint existe (405 = méthode non autorisée)')
        } else if (response.status === 404) {
          console.log('   ❌ Endpoint n\'existe pas (404)')
        } else {
          console.log('   ℹ️  Réponse inattendue')
        }
        
        // Si c'est le webhook, tester POST aussi
        if (url.includes('/webhooks/cinetpay')) {
          const postResponse = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: true })
          })
          console.log(`   POST: ${postResponse.status} ${postResponse.statusText}`)
        }
        
      } catch (error) {
        console.log(`   ❌ Erreur: ${error.message}`)
      }
      
      console.log('')
    }

  } catch (error) {
    console.error('❌ Erreur script:', error.message)
  }
}

checkWebhookProduction().catch(console.error)
