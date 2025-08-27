/**
 * Constantes héritées - migration vers src/lib/constants/app.js
 * @deprecated Utilisez les constantes de app.js à la place
 */

// Re-export des constantes consolidées
export { 
  ORDER_STATUS as ORDER_STATUSES,
  PAYMENT_STATUS,
  USER_ROLES,
  PLATFORMS,
  SERVICE_TYPES as SERVICE_CATEGORIES,
  CURRENCIES,
  DEFAULT_LIMITS as LIMITS
} from './app.js'

// Constantes spécifiques à conserver temporairement
export const TRIAL_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  DELIVERED: 'delivered',
  REJECTED: 'rejected'
}

// Configuration des devises (format étendu)
export const CURRENCY_CONFIG = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'Dollar américain'
  },
  CDF: {
    code: 'CDF',
    symbol: 'FC',
    name: 'Franc congolais'
  }
}

// Taux de change (à mettre à jour régulièrement via API)
export const EXCHANGE_RATES = {
  USD_TO_CDF: 2800, // 1 USD = 2800 CDF (exemple)
  CDF_TO_USD: 0.000357 // 1 CDF = 0.000357 USD
}

// Méthodes de paiement legacy (migration vers CINETPAY_METHODS)
export const PAYMENT_METHODS = {
  ORANGE: 'ORANGE_MONEY_CD',
  AIRTEL: 'AIRTEL_MONEY_CD', 
  MPESA: 'MPESA',
  AFRIMONEY: 'afrimoney' // Deprecated
}