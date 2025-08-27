// Rate Limiting avancé pour l'API
import { NextResponse } from 'next/server'

// Configuration des limites par endpoint
const RATE_LIMITS = {
  '/api/payments/cinetpay': { requests: 5, window: 60000 }, // 5 req/min
  '/api/orders': { requests: 10, window: 60000 }, // 10 req/min
  '/api/auth': { requests: 5, window: 300000 }, // 5 req/5min
  default: { requests: 100, window: 60000 } // 100 req/min par défaut
}

// Cache en mémoire pour les compteurs
const cache = new Map()

// Nettoyer le cache périodiquement
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > value.window) {
      cache.delete(key)
    }
  }
}, 60000) // Nettoyer toutes les minutes

/**
 * Middleware de rate limiting
 */
export function rateLimit(endpoint) {
  return async (request) => {
    try {
      // Obtenir l'IP du client
      const forwarded = request.headers.get('x-forwarded-for')
      const ip = forwarded ? forwarded.split(',')[0] : 
                 request.headers.get('x-real-ip') || 
                 'unknown'

      // Obtenir les limites pour cet endpoint
      const limits = RATE_LIMITS[endpoint] || RATE_LIMITS.default
      const key = `${ip}:${endpoint}`
      const now = Date.now()

      // Vérifier le cache
      const record = cache.get(key)
      
      if (!record) {
        // Premier appel
        cache.set(key, {
          count: 1,
          timestamp: now,
          window: limits.window
        })
        return null // Pas de limitation
      }

      // Vérifier si la fenêtre a expiré
      if (now - record.timestamp > limits.window) {
        // Réinitialiser le compteur
        cache.set(key, {
          count: 1,
          timestamp: now,
          window: limits.window
        })
        return null
      }

      // Incrémenter le compteur
      record.count++

      // Vérifier si la limite est dépassée
      if (record.count > limits.requests) {
        const resetTime = Math.ceil((record.timestamp + limits.window - now) / 1000)
        
        return NextResponse.json(
          {
            error: 'Trop de requêtes',
            message: `Limite de ${limits.requests} requêtes par ${Math.ceil(limits.window / 1000)}s dépassée`,
            retryAfter: resetTime,
            code: 'RATE_LIMITED'
          },
          { 
            status: 429,
            headers: {
              'Retry-After': resetTime.toString(),
              'X-RateLimit-Limit': limits.requests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': Math.ceil((record.timestamp + limits.window) / 1000).toString()
            }
          }
        )
      }

      // Mettre à jour les headers de réponse
      request.rateLimitHeaders = {
        'X-RateLimit-Limit': limits.requests.toString(),
        'X-RateLimit-Remaining': (limits.requests - record.count).toString(),
        'X-RateLimit-Reset': Math.ceil((record.timestamp + limits.window) / 1000).toString()
      }

      return null // Pas de limitation
    } catch (error) {
      console.error('Erreur rate limiting:', error)
      return null // En cas d'erreur, permettre la requête
    }
  }
}

/**
 * Rate limiting spécialisé pour les paiements
 */
export const paymentRateLimit = rateLimit('/api/payments/cinetpay')

/**
 * Rate limiting pour les créations de commandes
 */
export const orderRateLimit = rateLimit('/api/orders')

/**
 * Rate limiting pour l'authentification
 */
export const authRateLimit = rateLimit('/api/auth')

/**
 * Middleware de rate limiting avancé avec blocage temporaire
 */
export class AdvancedRateLimiter {
  constructor() {
    this.violations = new Map() // IP -> {count, firstViolation, blocked}
    this.VIOLATION_THRESHOLD = 3 // 3 violations = blocage
    this.BLOCK_DURATION = 300000 // 5 minutes
    this.VIOLATION_WINDOW = 600000 // 10 minutes
  }

  checkBlacklist(ip) {
    const record = this.violations.get(ip)
    if (!record) return false

    const now = Date.now()
    
    // Réinitialiser si la fenêtre a expiré
    if (now - record.firstViolation > this.VIOLATION_WINDOW) {
      this.violations.delete(ip)
      return false
    }

    // Vérifier si encore bloqué
    if (record.blocked && (now - record.blocked < this.BLOCK_DURATION)) {
      return true
    }

    // Débloquer si le temps est écoulé
    if (record.blocked && (now - record.blocked >= this.BLOCK_DURATION)) {
      this.violations.delete(ip)
      return false
    }

    return false
  }

  addViolation(ip) {
    const now = Date.now()
    const record = this.violations.get(ip) || { count: 0, firstViolation: now }

    record.count++
    
    // Bloquer si trop de violations
    if (record.count >= this.VIOLATION_THRESHOLD) {
      record.blocked = now
      console.warn(`🚨 IP ${ip} bloquée pour violations répétées`)
    }

    this.violations.set(ip, record)
  }

  middleware() {
    return async (request) => {
      const forwarded = request.headers.get('x-forwarded-for')
      const ip = forwarded ? forwarded.split(',')[0] : 
                 request.headers.get('x-real-ip') || 
                 'unknown'

      if (this.checkBlacklist(ip)) {
        return NextResponse.json(
          {
            error: 'Adresse IP temporairement bloquée',
            message: 'Trop de violations détectées',
            code: 'IP_BLOCKED'
          },
          { status: 403 }
        )
      }

      return null
    }
  }
}

// Instance globale du rate limiter avancé
export const advancedLimiter = new AdvancedRateLimiter()

/**
 * Helper pour ajouter les headers de rate limiting à une réponse
 */
export function addRateLimitHeaders(response, headers) {
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
  }
  return response
}
