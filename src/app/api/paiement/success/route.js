/**
 * Handler API pour la page de succès - gère les POST de CinetPay
 * CinetPay envoie parfois un POST au lieu d'un GET vers la page de succès
 */

import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    console.log('🔄 POST reçu sur /paiement/success - redirection en cours...')
    
    // Récupérer les paramètres de l'URL
    const url = new URL(request.url)
    const transactionId = url.searchParams.get('transaction_id')
    const token = url.searchParams.get('token')
    
    // Récupérer les données du body (si CinetPay envoie des données)
    let formData = {}
    try {
      const contentType = request.headers.get('content-type') || ''
      if (contentType.includes('application/x-www-form-urlencoded')) {
        const text = await request.text()
        const params = new URLSearchParams(text)
        for (const [key, value] of params.entries()) {
          formData[key] = value
        }
        console.log('Données POST reçues:', formData)
      }
    } catch (e) {
      console.log('Aucune donnée POST à parser')
    }
    
    // Construire l'URL de redirection GET
    let redirectUrl = '/paiement/success'
    const redirectParams = new URLSearchParams()
    
    // Utiliser les paramètres de l'URL ou du body
    const finalTransactionId = transactionId || formData.transaction_id || formData.cpm_trans_id
    const finalToken = token || formData.token
    
    if (finalTransactionId) {
      redirectParams.append('transaction_id', finalTransactionId)
    }
    if (finalToken) {
      redirectParams.append('token', finalToken)
    }
    
    // Ajouter d'autres paramètres utiles si présents
    if (formData.cpm_result) {
      redirectParams.append('result', formData.cpm_result)
    }
    
    if (redirectParams.toString()) {
      redirectUrl += '?' + redirectParams.toString()
    }
    
    console.log(`Redirection vers: ${redirectUrl}`)
    
    // Retourner une redirection 302
    return NextResponse.redirect(
      new URL(redirectUrl, request.url),
      { status: 302 }
    )
    
  } catch (error) {
    console.error('Erreur handler POST /paiement/success:', error)
    
    // En cas d'erreur, rediriger vers la page d'accueil
    return NextResponse.redirect(
      new URL('/', request.url),
      { status: 302 }
    )
  }
}

// Ajouter un GET handler pour éviter les erreurs si quelqu'un teste
export async function GET(request) {
  // La page React se chargera normalement pour les GET
  return NextResponse.redirect(
    new URL('/paiement/success' + request.url.split('/paiement/success')[1], request.url),
    { status: 302 }
  )
}
