// #!/usr/bin/env node

// /**
//  * Script de test pour valider le webhook CinetPay
//  * Usage: node scripts/test-webhook.js <transaction_id>
//  */

// const transactionId = process.argv[2] || 'OKIT1756431911287W1HSJ0XL'

// async function testWebhook() {
//   console.log(`🧪 Test webhook pour transaction: ${transactionId}`)
  
//   const payload = {
//     cpm_site_id: "105905501",
//     cpm_trans_id: transactionId,
//     cpm_trans_date: new Date().toISOString(),
//     cpm_amount: "100",
//     cpm_currency: "CDF",
//     cpm_result: "00",
//     cpm_trans_status: "ACCEPTED",
//     signature: "manual-completion-signature"
//   }
  
//   try {
//     console.log('📤 Envoi webhook...')
    
//     const response = await fetch('http://localhost:3000/api/webhooks/cinetpay', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify(payload)
//     })
    
//     const data = await response.json()
    
//     console.log('\n📋 Résultat:')
//     console.log('Status:', response.status)
//     console.log('Response:', JSON.stringify(data, null, 2))
    
//     if (response.ok && data.success) {
//       console.log('\n✅ Webhook traité avec succès!')
      
//       // Vérifier le statut après traitement
//       setTimeout(async () => {
//         try {
//           const statusResponse = await fetch(`http://localhost:3000/api/payments/cinetpay/status?transactionId=${transactionId}`)
//           const statusData = await statusResponse.json()
          
//           console.log('\n📊 Statut mis à jour:')
//           console.log('Transaction:', statusData.transaction?.status)
//           console.log('Commande:', statusData.order ? `Créée (${statusData.order.id})` : 'Non créée')
          
//         } catch (error) {
//           console.error('Erreur vérification statut:', error.message)
//         }
//       }, 1000)
      
//     } else {
//       console.log('\n❌ Échec du webhook')
//     }
    
//   } catch (error) {
//     console.error('\n❌ Erreur:', error.message)
//   }
// }

// testWebhook().catch(console.error)
