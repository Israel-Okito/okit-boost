// Validation de sécurité avancée
import { z } from 'zod'

/**
 * Validation des inputs avec sanitization
 */
export function sanitizeInput(input, type = 'text') {
  if (typeof input !== 'string') return ''
  
  switch (type) {
    case 'text':
      return input
        .trim()
        .replace(/[<>]/g, '') // Enlever < et >
        .substring(0, 1000) // Limiter la longueur
    
    case 'email':
      return input
        .trim()
        .toLowerCase()
        .substring(0, 254) // RFC 5321 limite
    
    case 'phone':
      return input
        .replace(/[^\d+\-\s]/g, '') // Garder seulement chiffres, +, -, espaces
        .trim()
        .substring(0, 20)
    
    case 'url':
      try {
        const url = new URL(input.trim())
        // Vérifier les protocoles autorisés
        if (!['http:', 'https:'].includes(url.protocol)) {
          throw new Error('Protocole non autorisé')
        }
        return url.href.substring(0, 2048) // Limite RFC
      } catch {
        throw new Error('URL invalide')
      }
    
    case 'number':
      const num = parseFloat(input)
      if (isNaN(num)) throw new Error('Nombre invalide')
      return num
    
    default:
      return input.trim().substring(0, 1000)
  }
}

/**
 * Schémas de validation Zod renforcés
 */
export const secureSchemas = {
  // Validation des données de paiement
  paymentData: z.object({
    cartItems: z.array(z.object({
      service_id: z.string().min(1, 'ID service requis').max(100, 'ID service trop long'),
      service_name: z.string().min(1).max(200),
      platform_id: z.string().min(1).max(50),
      target_link: z.string().url('URL invalide').max(2048),
      quantity: z.number().int().min(1).max(10000000),
      price_usd: z.number().min(0).max(1000000),
      price_cdf: z.number().min(0).max(1000000000),
      total_usd: z.number().min(0).max(1000000),
      total_cdf: z.number().min(0).max(1000000000)
    })).min(1).max(50), // Max 50 items
    currency: z.enum(['USD', 'CDF']),
    paymentMethod: z.enum(['orange', 'airtel', 'mtn', 'moov']),
    customerData: z.object({
      name: z.string().min(2).max(100).regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, 'Nom invalide'),
      email: z.string().email('Email invalide').max(254),
      phone: z.string().regex(/^(\+?243|0)[0-9]{9}$/, 'Téléphone RDC invalide'),
      address: z.string().max(500).optional(),
      city: z.string().max(100).optional()
    })
  }).strict(),

  // Validation des données client
  customerData: z.object({
    name: z.string()
      .min(2, 'Nom trop court')
      .max(100, 'Nom trop long')
      .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, 'Caractères invalides dans le nom'),
    email: z.string()
      .email('Format email invalide')
      .max(254, 'Email trop long'),
    phone: z.string()
      .regex(/^(\+?243|0)[0-9]{9}$/, 'Format téléphone RDC invalide')
  }).strict(),

  // Validation des services
  serviceOrder: z.object({
    service_id: z.string().min(1, 'ID service requis').max(100, 'ID service trop long'),
    quantity: z.number()
      .int('Quantité doit être un entier')
      .min(1, 'Quantité minimum: 1')
      .max(10000000, 'Quantité trop élevée'),
    target_link: z.string()
      .url('Lien invalide')
      .max(2048, 'Lien trop long')
      .refine(url => {
        const domain = new URL(url).hostname.toLowerCase()
        const allowedDomains = [
          'instagram.com', 'www.instagram.com',
          'tiktok.com', 'www.tiktok.com',
          'youtube.com', 'www.youtube.com', 'youtu.be',
          'facebook.com', 'www.facebook.com', 'fb.me'
        ]
        return allowedDomains.some(allowed => domain.includes(allowed))
      }, 'Domaine non autorisé')
  }).strict(),

  // Validation des transactions
  transactionCheck: z.object({
    transactionId: z.string()
      .min(5, 'ID transaction trop court')
      .max(100, 'ID transaction trop long')
      .regex(/^[A-Z0-9_]+$/, 'Format ID transaction invalide')
  }).strict()
}

/**
 * Validation avec gestion d'erreurs détaillée
 */
export function validateWithSecurity(schema, data, context = '') {
  try {
    // Pré-nettoyage des données textuelles
    const cleanedData = typeof data === 'object' ? cleanObjectData(data) : data
    
    // Validation avec Zod
    const result = schema.parse(cleanedData)
    
    return { success: true, data: result }
  } catch (error) {
    console.error(`Erreur validation ${context}:`, error)
    
    if (error instanceof z.ZodError) {
      const messages = (error.errors || []).map(err => ({
        field: (err.path || []).join('.'),
        message: err.message || 'Erreur de validation',
        code: err.code || 'validation_error'
      }))
      
      return {
        success: false,
        error: 'Données invalides',
        details: messages
      }
    }
    
    return {
      success: false,
      error: 'Erreur de validation',
      details: [{ message: error.message }]
    }
  }
}

/**
 * Nettoyage récursif des objets
 */
function cleanObjectData(obj) {
  if (typeof obj !== 'object' || obj === null) return obj
  
  if (Array.isArray(obj)) {
    return obj.map(item => cleanObjectData(item))
  }
  
  const cleaned = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Nettoyage contextuel selon le nom du champ
      if (key.includes('email')) {
        cleaned[key] = sanitizeInput(value, 'email')
      } else if (key.includes('phone')) {
        cleaned[key] = sanitizeInput(value, 'phone')
      } else if (key.includes('link') || key.includes('url')) {
        cleaned[key] = sanitizeInput(value, 'url')
      } else {
        cleaned[key] = sanitizeInput(value, 'text')
      }
    } else if (typeof value === 'object') {
      cleaned[key] = cleanObjectData(value)
    } else {
      cleaned[key] = value
    }
  }
  
  return cleaned
}

/**
 * Validation des montants avec vérifications de cohérence
 */
export function validateAmounts(items, currency, expectedTotal) {
  let calculatedUSD = 0
  let calculatedCDF = 0
  
  for (const item of items) {
    // Vérifier la cohérence des prix unitaires
    if (item.price_usd <= 0 || item.price_cdf <= 0) {
      throw new Error(`Prix invalide pour ${item.service_name}`)
    }
    
    // Vérifier la cohérence des totaux
    const expectedTotalUSD = item.price_usd * item.quantity
    const expectedTotalCDF = item.price_cdf * item.quantity
    
    if (Math.abs(item.total_usd - expectedTotalUSD) > 0.01) {
      throw new Error(`Total USD incorrect pour ${item.service_name}`)
    }
    
    if (Math.abs(item.total_cdf - expectedTotalCDF) > 1) {
      throw new Error(`Total CDF incorrect pour ${item.service_name}`)
    }
    
    calculatedUSD += expectedTotalUSD
    calculatedCDF += expectedTotalCDF
  }
  
  // Vérifier le total général
  const tolerance = currency === 'USD' ? 0.01 : 1
  const calculatedTotal = currency === 'USD' ? calculatedUSD : calculatedCDF
  
  if (Math.abs(calculatedTotal - expectedTotal) > tolerance) {
    throw new Error(`Total général incorrect. Calculé: ${calculatedTotal}, Attendu: ${expectedTotal}`)
  }
  
  return {
    totalUSD: calculatedUSD,
    totalCDF: calculatedCDF,
    verified: true
  }
}

/**
 * Détection d'activité suspecte
 */
export class SuspiciousActivityDetector {
  constructor() {
    this.patterns = new Map() // IP -> patterns
  }
  
  checkActivity(ip, action, data = {}) {
    const now = Date.now()
    const pattern = this.patterns.get(ip) || {
      actions: [],
      firstSeen: now,
      warnings: 0
    }
    
    pattern.actions.push({
      action,
      timestamp: now,
      data: { ...data, sensitiveData: undefined } // Enlever données sensibles
    })
    
    // Garder seulement les 100 dernières actions
    if (pattern.actions.length > 100) {
      pattern.actions = pattern.actions.slice(-100)
    }
    
    const suspiciousScore = this.calculateSuspiciousScore(pattern)
    
    if (suspiciousScore > 80) {
      pattern.warnings++
      console.warn(`🚨 Activité suspecte détectée pour ${ip}:`, {
        score: suspiciousScore,
        warnings: pattern.warnings,
        recentActions: pattern.actions.slice(-10)
      })
      
      if (pattern.warnings >= 3) {
        return { suspicious: true, severity: 'high', score: suspiciousScore }
      } else {
        return { suspicious: true, severity: 'medium', score: suspiciousScore }
      }
    }
    
    this.patterns.set(ip, pattern)
    return { suspicious: false, score: suspiciousScore }
  }
  
  calculateSuspiciousScore(pattern) {
    let score = 0
    const now = Date.now()
    const recentActions = pattern.actions.filter(a => now - a.timestamp < 300000) // 5 minutes
    
    // Trop d'actions récentes
    if (recentActions.length > 50) score += 30
    
    // Actions répétitives
    const actionTypes = recentActions.map(a => a.action)
    const uniqueActions = new Set(actionTypes).size
    if (actionTypes.length > 10 && uniqueActions < 3) score += 25
    
    // Tentatives de paiement échouées répétées
    const failedPayments = recentActions.filter(a => 
      a.action === 'payment_failed' || a.action === 'payment_error'
    ).length
    if (failedPayments > 3) score += 40
    
    // Différents emails/téléphones utilisés
    const emails = new Set(recentActions.map(a => a.data?.email).filter(Boolean))
    const phones = new Set(recentActions.map(a => a.data?.phone).filter(Boolean))
    if (emails.size > 3 || phones.size > 3) score += 20
    
    return Math.min(100, score)
  }
}

// Instance globale du détecteur
export const suspiciousDetector = new SuspiciousActivityDetector()
