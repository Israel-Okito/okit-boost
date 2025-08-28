// Configuration de base CinetPay
export const baseCinetpayConfig = {
    apiKey: process.env.CINETPAY_API_KEY,
    siteId: parseInt(process.env.CINETPAY_SITE_ID),
    secretKey: process.env.CINETPAY_SECRET_KEY,
    baseUrl: process.env.CINETPAY_BASE_URL || 'https://api-checkout.cinetpay.com/v2',
    sandboxMode: process.env.CINETPAY_SANDBOX_MODE === 'true',
    
    // Devises supportées
    currencies: {
      CDF: 'CDF',
      USD: 'USD',
      XAF: 'XAF',
      XOF: 'XOF'
    },
    
    // Canaux de paiement disponibles
    channels: {
      ORANGE_MONEY_CM: 'ORANGE_MONEY_CM',
      ORANGE_MONEY_CI: 'ORANGE_MONEY_CI', 
      ORANGE_MONEY_SN: 'ORANGE_MONEY_SN',
      MTN_MONEY_CM: 'MTN_MONEY_CM',
      MTN_MONEY_CI: 'MTN_MONEY_CI',
      MTN_MONEY_SN: 'MTN_MONEY_SN',
      MOOV_MONEY_CI: 'MOOV_MONEY_CI',
      MOOV_MONEY_SN: 'MOOV_MONEY_SN',
      AIRTEL_MONEY: 'AIRTEL_MONEY',
      // Pour la RDC
      ORANGE_MONEY_CD: 'ORANGE_MONEY_CD',
      AIRTEL_MONEY_CD: 'AIRTEL_MONEY_CD',
      MPESA: 'MPESA',
      MPESA_CD: 'MPESA_CD'
    },
  
    // Statuts des transactions
    transactionStatus: {
      ACCEPTED: 'ACCEPTED',
      REFUSED: 'REFUSED', 
      PENDING: 'PENDING',
      CANCELLED: 'CANCELLED'
    }
  }

// Fonction pour obtenir la configuration complète avec URLs dynamiques
export function getCinetpayConfig() {
  // Import dynamique pour éviter les imports circulaires
  const { getCinetPayConfig } = require('@/lib/utils/url')
  
  return {
    ...baseCinetpayConfig,
    ...getCinetPayConfig()
  }
}

// Pour la compatibilité
export const cinetpayConfig = getCinetpayConfig()

// Validation de la configuration
export function validateCinetpayConfig() {
  const config = getCinetpayConfig()
  const requiredFields = ['apiKey', 'siteId', 'secretKey', 'notifyUrl', 'returnUrl', 'cancelUrl']
  
  for (const field of requiredFields) {
    if (!config[field]) {
      throw new Error(`Configuration CinetPay manquante: ${field}`)
    }
  }
  
  return true
}