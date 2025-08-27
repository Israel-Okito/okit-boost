// Middleware de sécurité intégré
import { NextResponse } from 'next/server'
import { rateLimit, advancedLimiter } from './rateLimit'
import { csrfProtection, doubleSubmitCookieProtection } from './csrf'
import { validateWithSecurity, suspiciousDetector } from './validation'

/**
 * Configuration de sécurité par endpoint
 */
const SECURITY_CONFIG = {
  '/api/payments/cinetpay': {
    rateLimit: true,
    csrf: false, // CinetPay gère sa propre sécurité
    suspicious: true,
    methods: ['POST'],
    sensitiveEndpoint: true
  },
  '/api/orders': {
    rateLimit: true,
    csrf: true,
    suspicious: true,
    methods: ['POST', 'GET'],
    sensitiveEndpoint: true
  },
  '/api/webhooks/cinetpay': {
    rateLimit: false, // Les webhooks ont leur propre protection
    csrf: false,
    suspicious: false,
    methods: ['POST'],
    webhookEndpoint: true
  },
  '/api/auth': {
    rateLimit: true,
    csrf: true,
    suspicious: true,
    methods: ['POST'],
    sensitiveEndpoint: true
  },
  '/api/admin': {
    rateLimit: true,
    csrf: true,
    suspicious: true,
    methods: ['POST', 'PUT', 'DELETE'],
    adminEndpoint: true
  }
}

/**
 * Middleware de sécurité principal
 */
export function createSecurityMiddleware(endpoint) {
  const config = SECURITY_CONFIG[endpoint] || {
    rateLimit: true,
    csrf: false,
    suspicious: false,
    methods: ['GET', 'POST']
  }

  return async (request) => {
    const startTime = Date.now()
    
    try {
      // 1. Vérification méthode HTTP
      if (!config.methods.includes(request.method)) {
        return NextResponse.json(
          { error: 'Méthode non autorisée' },
          { status: 405 }
        )
      }

      // 2. Obtenir informations client
      const clientInfo = getClientInfo(request)
      
      // 3. Vérification IP blacklist
      const blacklistCheck = await advancedLimiter.middleware()(request)
      if (blacklistCheck) return blacklistCheck

      // 4. Rate limiting si activé
      if (config.rateLimit) {
        const rateLimitCheck = await rateLimit(endpoint)(request)
        if (rateLimitCheck) {
          // Ajouter violation pour rate limiting excessif
          advancedLimiter.addViolation(clientInfo.ip)
          return rateLimitCheck
        }
      }

      // 5. Protection CSRF si activée
      if (config.csrf && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
        const csrfCheck = await csrfProtection({
          oneTimeUse: config.sensitiveEndpoint
        })(request)
        if (csrfCheck) return csrfCheck
      }

      // 6. Détection d'activité suspecte
      if (config.suspicious) {
        const body = await tryParseBody(request)
        const suspiciousCheck = suspiciousDetector.checkActivity(
          clientInfo.ip,
          `${request.method}_${endpoint}`,
          {
            userAgent: clientInfo.userAgent,
            email: body?.customerData?.email,
            phone: body?.customerData?.phone
          }
        )

        if (suspiciousCheck.suspicious && suspiciousCheck.severity === 'high') {
          console.warn(`🚨 Blocage activité suspecte: ${clientInfo.ip}`)
          return NextResponse.json(
            {
              error: 'Activité suspecte détectée',
              code: 'SUSPICIOUS_ACTIVITY'
            },
            { status: 403 }
          )
        }
      }

      // 7. Validation spécifique pour endpoints sensibles
      if (config.sensitiveEndpoint) {
        const validationResult = await validateSensitiveEndpoint(request, endpoint)
        if (validationResult) return validationResult
      }

      // 8. Log de sécurité
      logSecurityEvent({
        endpoint,
        method: request.method,
        ip: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        duration: Date.now() - startTime,
        status: 'allowed'
      })

      return null // Requête autorisée

    } catch (error) {
      console.error('Erreur middleware sécurité:', error)
      
      logSecurityEvent({
        endpoint,
        method: request.method,
        ip: getClientInfo(request).ip,
        duration: Date.now() - startTime,
        status: 'error',
        error: error.message
      })

      return NextResponse.json(
        { error: 'Erreur de sécurité interne' },
        { status: 500 }
      )
    }
  }
}

/**
 * Obtenir informations client sécurisées
 */
function getClientInfo(request) {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 
             request.headers.get('x-real-ip') || 
             'unknown'
  
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  return {
    ip: ip.substring(0, 45), // Limite IPv6
    userAgent: userAgent.substring(0, 500),
    timestamp: Date.now()
  }
}

/**
 * Parse le body de manière sécurisée
 */
async function tryParseBody(request) {
  try {
    // Cloner la requête pour ne pas consommer le body
    const clonedRequest = request.clone()
    return await clonedRequest.json()
  } catch {
    return null
  }
}

/**
 * Validation spéciale pour endpoints sensibles
 */
async function validateSensitiveEndpoint(request, endpoint) {
  const body = await tryParseBody(request)
  
  switch (endpoint) {
    case '/api/payments/cinetpay':
      return await validatePaymentEndpoint(body)
    
    case '/api/orders':
      return await validateOrderEndpoint(body)
    
    default:
      return null
  }
}

/**
 * Validation endpoint paiement
 */
async function validatePaymentEndpoint(body) {
  if (!body) {
    return NextResponse.json(
      { error: 'Corps de requête manquant' },
      { status: 400 }
    )
  }

  // Vérifications de base
  const requiredFields = ['cartItems', 'paymentMethod', 'customerData', 'currency']
  for (const field of requiredFields) {
    if (!body[field]) {
      return NextResponse.json(
        { error: `Champ requis manquant: ${field}` },
        { status: 400 }
      )
    }
  }

  // Validation des montants
  if (!Array.isArray(body.cartItems) || body.cartItems.length === 0) {
    return NextResponse.json(
      { error: 'Panier vide ou invalide' },
      { status: 400 }
    )
  }

  // Limite du nombre d'items
  if (body.cartItems.length > 50) {
    return NextResponse.json(
      { error: 'Trop d\'articles dans le panier (max 50)' },
      { status: 400 }
    )
  }

  // Validation des montants totaux
  let totalCalculated = 0
  for (const item of body.cartItems) {
    if (!item.price_cdf || !item.quantity) continue
    totalCalculated += item.price_cdf * item.quantity
  }

  // Vérifier la cohérence (tolérance de 1 CDF)
  const expectedTotal = body.cartItems.reduce((sum, item) => 
    sum + (item.total_cdf || 0), 0
  )

  if (Math.abs(totalCalculated - expectedTotal) > 1) {
    return NextResponse.json(
      { error: 'Incohérence dans les montants' },
      { status: 400 }
    )
  }

  return null // Validation OK
}

/**
 * Validation endpoint commandes
 */
async function validateOrderEndpoint(body) {
  if (request.method === 'GET') return null // GET requests sont OK
  
  if (!body) {
    return NextResponse.json(
      { error: 'Corps de requête manquant' },
      { status: 400 }
    )
  }

  // Validation similaire aux paiements
  return validatePaymentEndpoint(body)
}

/**
 * Logging sécurisé des événements
 */
function logSecurityEvent(event) {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    level: event.status === 'error' ? 'ERROR' : 'INFO',
    type: 'SECURITY',
    ...event,
    // Anonymiser l'IP pour la conformité GDPR
    ip_hash: event.ip !== 'unknown' ? hashIP(event.ip) : 'unknown'
  }
  
  // En production, envoyer à un service de logging
  console.log('SECURITY_LOG:', JSON.stringify(logEntry))
}

/**
 * Hash IP pour anonymisation
 */
function hashIP(ip) {
  const crypto = require('crypto')
  return crypto
    .createHash('sha256')
    .update(ip + process.env.IP_SALT || 'default-salt')
    .digest('hex')
    .substring(0, 16)
}

/**
 * Middleware spécialisés prêts à l'emploi
 */
export const securePaymentMiddleware = createSecurityMiddleware('/api/payments/cinetpay')
export const secureOrderMiddleware = createSecurityMiddleware('/api/orders')
export const secureAuthMiddleware = createSecurityMiddleware('/api/auth')
export const secureAdminMiddleware = createSecurityMiddleware('/api/admin')

/**
 * Headers de sécurité avancés
 */
export function addSecurityHeaders(response) {
  // Protection contre le clickjacking
  response.headers.set('X-Frame-Options', 'DENY')
  
  // Protection contre le sniffing MIME
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // Protection XSS
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Référent policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // CSP basique
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api-checkout.cinetpay.com"
  )
  
  // HSTS (HTTPS uniquement)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }
  
  return response
}

/**
 * Middleware de sécurité pour Next.js
 */
export function withSecurity(handler, endpoint) {
  return async (request) => {
    const securityCheck = await createSecurityMiddleware(endpoint)(request)
    if (securityCheck) return securityCheck
    
    const response = await handler(request)
    return addSecurityHeaders(response)
  }
}
