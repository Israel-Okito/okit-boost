// Protection CSRF avancée
import crypto from 'crypto'
import { NextResponse } from 'next/server'

// Configuration CSRF
const CSRF_CONFIG = {
  secretKey: process.env.CSRF_SECRET_KEY || 'fallback-secret-key-change-me',
  tokenExpiry: 3600000, // 1 heure
  cookieName: '__csrf-token',
  headerName: 'x-csrf-token',
  maxTokensPerSession: 10
}

// Cache des tokens actifs (en production, utiliser Redis)
const tokenCache = new Map()

// Nettoyer les tokens expirés
setInterval(() => {
  const now = Date.now()
  for (const [token, data] of tokenCache.entries()) {
    if (now > data.expiresAt) {
      tokenCache.delete(token)
    }
  }
}, 300000) // Nettoyer toutes les 5 minutes

/**
 * Générer un token CSRF sécurisé
 */
export function generateCSRFToken(sessionId) {
  const timestamp = Date.now()
  const random = crypto.randomBytes(32).toString('hex')
  const payload = `${sessionId}:${timestamp}:${random}`
  
  // Créer une signature HMAC
  const signature = crypto
    .createHmac('sha256', CSRF_CONFIG.secretKey)
    .update(payload)
    .digest('hex')
  
  const token = `${Buffer.from(payload).toString('base64')}.${signature}`
  
  // Stocker le token avec son expiration
  tokenCache.set(token, {
    sessionId,
    createdAt: timestamp,
    expiresAt: timestamp + CSRF_CONFIG.tokenExpiry,
    used: false
  })
  
  // Limiter le nombre de tokens par session
  const sessionTokens = Array.from(tokenCache.entries())
    .filter(([_, data]) => data.sessionId === sessionId)
  
  if (sessionTokens.length > CSRF_CONFIG.maxTokensPerSession) {
    // Supprimer les plus anciens tokens
    sessionTokens
      .sort(([_, a], [__, b]) => a.createdAt - b.createdAt)
      .slice(0, sessionTokens.length - CSRF_CONFIG.maxTokensPerSession)
      .forEach(([token, _]) => tokenCache.delete(token))
  }
  
  return token
}

/**
 * Valider un token CSRF
 */
export function validateCSRFToken(token, sessionId, oneTimeUse = false) {
  if (!token || !sessionId) {
    return { valid: false, error: 'Token ou session manquant' }
  }
  
  try {
    // Vérifier le format du token
    const parts = token.split('.')
    if (parts.length !== 2) {
      return { valid: false, error: 'Format token invalide' }
    }
    
    const [payloadBase64, signature] = parts
    const payload = Buffer.from(payloadBase64, 'base64').toString()
    
    // Vérifier la signature
    const expectedSignature = crypto
      .createHmac('sha256', CSRF_CONFIG.secretKey)
      .update(payload)
      .digest('hex')
    
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return { valid: false, error: 'Signature invalide' }
    }
    
    // Vérifier l'existence du token en cache
    const tokenData = tokenCache.get(token)
    if (!tokenData) {
      return { valid: false, error: 'Token non trouvé ou expiré' }
    }
    
    // Vérifier l'expiration
    if (Date.now() > tokenData.expiresAt) {
      tokenCache.delete(token)
      return { valid: false, error: 'Token expiré' }
    }
    
    // Vérifier la session
    if (tokenData.sessionId !== sessionId) {
      return { valid: false, error: 'Session incorrecte' }
    }
    
    // Vérifier si déjà utilisé (pour les tokens à usage unique)
    if (oneTimeUse && tokenData.used) {
      return { valid: false, error: 'Token déjà utilisé' }
    }
    
    // Marquer comme utilisé si nécessaire
    if (oneTimeUse) {
      tokenData.used = true
    }
    
    return { valid: true, tokenData }
  } catch (error) {
    console.error('Erreur validation CSRF:', error)
    return { valid: false, error: 'Erreur validation' }
  }
}

/**
 * Middleware de protection CSRF
 */
export function csrfProtection(options = {}) {
  const {
    methods = ['POST', 'PUT', 'DELETE', 'PATCH'],
    skipPaths = [],
    oneTimeUse = false
  } = options
  
  return async (request) => {
    const method = request.method
    const pathname = new URL(request.url).pathname
    
    // Ignorer les méthodes sûres
    if (!methods.includes(method)) {
      return null
    }
    
    // Ignorer les chemins spécifiés
    if (skipPaths.some(path => pathname.startsWith(path))) {
      return null
    }
    
    try {
      // Obtenir le token depuis les headers
      const token = request.headers.get(CSRF_CONFIG.headerName)
      
      // Obtenir la session ID (ici on utilise l'IP + User-Agent comme fallback)
      const sessionId = getSessionId(request)
      
      // Valider le token
      const validation = validateCSRFToken(token, sessionId, oneTimeUse)
      
      if (!validation.valid) {
        console.warn(`CSRF validation failed: ${validation.error}`, {
          method,
          pathname,
          sessionId,
          hasToken: !!token
        })
        
        return NextResponse.json(
          {
            error: 'Token CSRF invalide',
            message: 'Veuillez recharger la page et réessayer',
            code: 'CSRF_TOKEN_INVALID'
          },
          { status: 403 }
        )
      }
      
      return null // Validation réussie
    } catch (error) {
      console.error('Erreur middleware CSRF:', error)
      return NextResponse.json(
        {
          error: 'Erreur de sécurité',
          code: 'CSRF_ERROR'
        },
        { status: 500 }
      )
    }
  }
}

/**
 * Obtenir un ID de session basique
 */
function getSessionId(request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') ||
            'unknown'
  
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  // Hash simple pour créer un ID de session
  return crypto
    .createHash('sha256')
    .update(`${ip}:${userAgent}`)
    .digest('hex')
    .substring(0, 32)
}

/**
 * API endpoint pour obtenir un token CSRF
 */
export async function getCSRFTokenHandler(request) {
  try {
    const sessionId = getSessionId(request)
    const token = generateCSRFToken(sessionId)
    
    const response = NextResponse.json({
      success: true,
      token,
      expiresIn: CSRF_CONFIG.tokenExpiry / 1000 // en secondes
    })
    
    // Ajouter le token dans un cookie sécurisé
    response.cookies.set(CSRF_CONFIG.cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: CSRF_CONFIG.tokenExpiry / 1000
    })
    
    return response
  } catch (error) {
    console.error('Erreur génération token CSRF:', error)
    return NextResponse.json(
      { error: 'Erreur génération token' },
      { status: 500 }
    )
  }
}

/**
 * Hook côté client pour gérer les tokens CSRF
 */
export const csrfClientUtils = {
  // Obtenir un nouveau token
  async getToken() {
    try {
      const response = await fetch('/api/csrf-token')
      const data = await response.json()
      
      if (data.success) {
        // Stocker en localStorage pour les requêtes futures
        localStorage.setItem('csrf-token', data.token)
        return data.token
      }
      
      throw new Error(data.error || 'Erreur obtention token')
    } catch (error) {
      console.error('Erreur CSRF getToken:', error)
      throw error
    }
  },
  
  // Obtenir le token stocké
  getStoredToken() {
    return localStorage.getItem('csrf-token')
  },
  
  // Ajouter le token aux headers de requête
  addTokenToHeaders(headers = {}) {
    const token = this.getStoredToken()
    if (token) {
      headers[CSRF_CONFIG.headerName] = token
    }
    return headers
  },
  
  // Wrapper fetch avec token CSRF automatique
  async secureFetch(url, options = {}) {
    const token = this.getStoredToken()
    
    // Si pas de token, en obtenir un nouveau
    if (!token && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method?.toUpperCase())) {
      await this.getToken()
    }
    
    // Ajouter le token aux headers
    const headers = this.addTokenToHeaders(options.headers || {})
    
    return fetch(url, {
      ...options,
      headers
    })
  }
}

/**
 * Protection double submit cookie
 */
export function doubleSubmitCookieProtection() {
  return async (request) => {
    const method = request.method
    
    if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      return null
    }
    
    // Obtenir le token depuis le header
    const headerToken = request.headers.get(CSRF_CONFIG.headerName)
    
    // Obtenir le token depuis le cookie
    const cookieToken = request.cookies.get(CSRF_CONFIG.cookieName)?.value
    
    // Vérifier que les deux tokens correspondent
    if (!headerToken || !cookieToken || headerToken !== cookieToken) {
      return NextResponse.json(
        {
          error: 'Protection CSRF échouée',
          code: 'CSRF_MISMATCH'
        },
        { status: 403 }
      )
    }
    
    return null
  }
}
