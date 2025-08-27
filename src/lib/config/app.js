/**
 * Configuration centralisée de l'application
 * Variables d'environnement et configuration par défaut
 */

// Environnement
export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
}

// URLs de base
export const URLS = {
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  API_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
  ASSETS_URL: process.env.NEXT_PUBLIC_ASSETS_URL || '/assets'
}

// Configuration Supabase
export const SUPABASE = {
  URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
}

// Configuration CinetPay
export const CINETPAY = {
  API_KEY: process.env.CINETPAY_API_KEY,
  SITE_ID: process.env.CINETPAY_SITE_ID,
  SECRET_KEY: process.env.CINETPAY_SECRET_KEY,
  BASE_URL: process.env.CINETPAY_BASE_URL || 'https://api-checkout.cinetpay.com/v2',
  WEBHOOK_SECRET: process.env.CINETPAY_WEBHOOK_SECRET,
  RETURN_URL: `${URLS.APP_URL}/paiement/success`,
  CANCEL_URL: `${URLS.APP_URL}/paiement/cancel`,
  NOTIFY_URL: `${URLS.APP_URL}/api/webhooks/cinetpay`
}

// Configuration de la base de données
export const DATABASE = {
  CONNECTION_TIMEOUT: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 30000,
  QUERY_TIMEOUT: parseInt(process.env.DB_QUERY_TIMEOUT) || 15000,
  MAX_CONNECTIONS: parseInt(process.env.DB_MAX_CONNECTIONS) || 10
}

// Configuration des logs
export const LOGGING = {
  LEVEL: process.env.LOG_LEVEL || (ENV.IS_PRODUCTION ? 'info' : 'debug'),
  FILE_ENABLED: process.env.LOG_FILE_ENABLED === 'true',
  MAX_FILE_SIZE: parseInt(process.env.LOG_MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  MAX_FILES: parseInt(process.env.LOG_MAX_FILES) || 5,
  LOG_DIR: process.env.LOG_DIR || 'logs'
}

// Configuration de la sécurité
export const SECURITY = {
  JWT_SECRET: process.env.JWT_SECRET,
  CSRF_SECRET: process.env.CSRF_SECRET || 'default-csrf-secret',
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  SESSION_TIMEOUT: parseInt(process.env.SESSION_TIMEOUT) || 24 * 60 * 60 * 1000, // 24 heures
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12
}

// Configuration du cache
export const CACHE = {
  REDIS_URL: process.env.REDIS_URL,
  DEFAULT_TTL: parseInt(process.env.CACHE_DEFAULT_TTL) || 300, // 5 minutes
  LONG_TTL: parseInt(process.env.CACHE_LONG_TTL) || 3600, // 1 heure
  SHORT_TTL: parseInt(process.env.CACHE_SHORT_TTL) || 60 // 1 minute
}

// Configuration des emails
export const EMAIL = {
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT) || 587,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  FROM_EMAIL: process.env.FROM_EMAIL || 'noreply@okit-boost.com',
  FROM_NAME: process.env.FROM_NAME || 'Okit Boost'
}

// Configuration des fichiers
export const FILES = {
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
  ALLOWED_EXTENSIONS: process.env.ALLOWED_EXTENSIONS?.split(',') || [
    'jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'
  ],
  CDN_URL: process.env.CDN_URL
}

// Configuration des notifications
export const NOTIFICATIONS = {
  SLACK_WEBHOOK: process.env.SLACK_WEBHOOK_URL,
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
  ENABLE_EMAIL: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
  ENABLE_SLACK: process.env.ENABLE_SLACK_NOTIFICATIONS === 'true',
  ENABLE_TELEGRAM: process.env.ENABLE_TELEGRAM_NOTIFICATIONS === 'true'
}

// Configuration du monitoring
export const MONITORING = {
  SENTRY_DSN: process.env.SENTRY_DSN,
  ANALYTICS_ID: process.env.NEXT_PUBLIC_ANALYTICS_ID,
  ENABLE_METRICS: process.env.ENABLE_METRICS === 'true',
  METRICS_ENDPOINT: process.env.METRICS_ENDPOINT || '/api/metrics'
}

// Configuration des APIs externes
export const EXTERNAL_APIS = {
  EXCHANGE_RATES_API: process.env.EXCHANGE_RATES_API_URL,
  EXCHANGE_RATES_KEY: process.env.EXCHANGE_RATES_API_KEY,
  SMS_API_URL: process.env.SMS_API_URL,
  SMS_API_KEY: process.env.SMS_API_KEY
}

// Configuration des limites
export const LIMITS = {
  // Requêtes par minute
  API_RATE_LIMIT: parseInt(process.env.API_RATE_LIMIT) || 60,
  
  // Tailles maximales
  MAX_ORDER_ITEMS: parseInt(process.env.MAX_ORDER_ITEMS) || 10,
  MAX_CART_ITEMS: parseInt(process.env.MAX_CART_ITEMS) || 20,
  MAX_QUANTITY_PER_ITEM: parseInt(process.env.MAX_QUANTITY_PER_ITEM) || 100000,
  
  // Limites utilisateur
  MAX_ORDERS_PER_DAY: parseInt(process.env.MAX_ORDERS_PER_DAY) || 10,
  MAX_TRIALS_PER_DAY: parseInt(process.env.MAX_TRIALS_PER_DAY) || 1,
  
  // Pagination
  DEFAULT_PAGE_SIZE: parseInt(process.env.DEFAULT_PAGE_SIZE) || 20,
  MAX_PAGE_SIZE: parseInt(process.env.MAX_PAGE_SIZE) || 100
}

// Configuration des features flags
export const FEATURES = {
  ENABLE_REGISTRATION: process.env.ENABLE_REGISTRATION !== 'false',
  ENABLE_TRIALS: process.env.ENABLE_TRIALS !== 'false',
  ENABLE_MANUAL_PAYMENTS: process.env.ENABLE_MANUAL_PAYMENTS !== 'false',
  ENABLE_CINETPAY: process.env.ENABLE_CINETPAY !== 'false',
  ENABLE_NOTIFICATIONS: process.env.ENABLE_NOTIFICATIONS !== 'false',
  ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS !== 'false',
  MAINTENANCE_MODE: process.env.MAINTENANCE_MODE === 'true'
}

// Configuration des timeouts
export const TIMEOUTS = {
  API_REQUEST: parseInt(process.env.API_REQUEST_TIMEOUT) || 30000, // 30s
  DATABASE_QUERY: parseInt(process.env.DB_QUERY_TIMEOUT) || 15000, // 15s
  PAYMENT_WEBHOOK: parseInt(process.env.PAYMENT_WEBHOOK_TIMEOUT) || 30000, // 30s
  FILE_UPLOAD: parseInt(process.env.FILE_UPLOAD_TIMEOUT) || 60000, // 1 minute
  EMAIL_SEND: parseInt(process.env.EMAIL_SEND_TIMEOUT) || 10000 // 10s
}

// Validation des variables d'environnement critiques
export function validateConfig() {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]

  const missingVars = requiredVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    throw new Error(`Variables d'environnement manquantes: ${missingVars.join(', ')}`)
  }

  // Validation CinetPay en production
  if (ENV.IS_PRODUCTION && FEATURES.ENABLE_CINETPAY) {
    const cinetPayVars = [
      'CINETPAY_API_KEY',
      'CINETPAY_SITE_ID',
      'CINETPAY_SECRET_KEY'
    ]

    const missingCinetPayVars = cinetPayVars.filter(varName => !process.env[varName])
    
    if (missingCinetPayVars.length > 0) {
      console.warn(`Variables CinetPay manquantes: ${missingCinetPayVars.join(', ')}`)
    }
  }
}

// Configuration par défaut exportée
export default {
  ENV,
  URLS,
  SUPABASE,
  CINETPAY,
  DATABASE,
  LOGGING,
  SECURITY,
  CACHE,
  EMAIL,
  FILES,
  NOTIFICATIONS,
  MONITORING,
  EXTERNAL_APIS,
  LIMITS,
  FEATURES,
  TIMEOUTS,
  validateConfig
}
