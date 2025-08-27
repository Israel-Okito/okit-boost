// Middleware de performance pour optimisation automatique
import { NextResponse } from 'next/server'
import { memoryCache } from './cache'

/**
 * Classe pour mesurer les performances des API
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map()
    this.slowQueries = []
    this.startTime = Date.now()
  }

  recordMetric(endpoint, method, duration, statusCode, cacheHit = false) {
    const key = `${method}_${endpoint}`
    const metric = this.metrics.get(key) || {
      count: 0,
      totalDuration: 0,
      averageDuration: 0,
      minDuration: Infinity,
      maxDuration: 0,
      errorCount: 0,
      cacheHits: 0,
      lastAccessed: null
    }

    metric.count++
    metric.totalDuration += duration
    metric.averageDuration = metric.totalDuration / metric.count
    metric.minDuration = Math.min(metric.minDuration, duration)
    metric.maxDuration = Math.max(metric.maxDuration, duration)
    metric.lastAccessed = new Date().toISOString()

    if (statusCode >= 400) {
      metric.errorCount++
    }

    if (cacheHit) {
      metric.cacheHits++
    }

    // Enregistrer les requêtes lentes
    if (duration > 1000) {
      this.slowQueries.push({
        endpoint: key,
        duration,
        timestamp: new Date().toISOString(),
        statusCode
      })

      // Garder seulement les 50 dernières requêtes lentes
      if (this.slowQueries.length > 50) {
        this.slowQueries = this.slowQueries.slice(-50)
      }
    }

    this.metrics.set(key, metric)
  }

  getMetrics() {
    const allMetrics = Array.from(this.metrics.entries()).map(([endpoint, data]) => ({
      endpoint,
      ...data,
      errorRate: data.count > 0 ? (data.errorCount / data.count * 100).toFixed(2) + '%' : '0%',
      cacheHitRate: data.count > 0 ? (data.cacheHits / data.count * 100).toFixed(2) + '%' : '0%'
    }))

    return {
      uptime: Date.now() - this.startTime,
      totalRequests: allMetrics.reduce((sum, m) => sum + m.count, 0),
      averageResponseTime: allMetrics.reduce((sum, m) => sum + m.averageDuration, 0) / allMetrics.length || 0,
      slowQueries: this.slowQueries,
      topEndpoints: allMetrics.sort((a, b) => b.count - a.count).slice(0, 10),
      slowestEndpoints: allMetrics.sort((a, b) => b.averageDuration - a.averageDuration).slice(0, 10)
    }
  }

  reset() {
    this.metrics.clear()
    this.slowQueries = []
    this.startTime = Date.now()
  }
}

// Instance globale du moniteur
export const performanceMonitor = new PerformanceMonitor()

/**
 * Middleware de performance principal
 */
export function withPerformanceOptimization(handler, options = {}) {
  const {
    enableCache = true,
    cacheTTL = 300000, // 5 minutes
    enableCompression = true,
    enableMetrics = true,
    slowQueryThreshold = 1000
  } = options

  return async (request) => {
    const startTime = Date.now()
    const method = request.method
    const url = new URL(request.url)
    const endpoint = url.pathname

    // Headers de performance
    const performanceHeaders = new Headers()
    performanceHeaders.set('X-Response-Time-Start', startTime.toString())

    try {
      // Vérifier le cache pour les requêtes GET
      if (enableCache && method === 'GET') {
        const cacheKey = `api_${endpoint}_${url.search}`
        const cached = memoryCache.get(cacheKey)
        
        if (cached) {
          const duration = Date.now() - startTime
          
          if (enableMetrics) {
            performanceMonitor.recordMetric(endpoint, method, duration, 200, true)
          }

          const response = NextResponse.json(cached)
          response.headers.set('X-Cache', 'HIT')
          response.headers.set('X-Response-Time', `${duration}ms`)
          
          return response
        }
      }

      // Exécuter le handler original
      const response = await handler(request)
      const duration = Date.now() - startTime

      // Enregistrer les métriques
      if (enableMetrics) {
        performanceMonitor.recordMetric(endpoint, method, duration, response.status, false)
      }

      // Ajouter headers de performance
      response.headers.set('X-Response-Time', `${duration}ms`)
      response.headers.set('X-Cache', 'MISS')

      // Warning pour les requêtes lentes
      if (duration > slowQueryThreshold) {
        console.warn(`🐌 Requête lente détectée: ${method} ${endpoint} - ${duration}ms`)
        response.headers.set('X-Slow-Query', 'true')
      }

      // Mettre en cache si c'est un GET avec succès
      if (enableCache && method === 'GET' && response.ok) {
        try {
          const responseClone = response.clone()
          const data = await responseClone.json()
          const cacheKey = `api_${endpoint}_${url.search}`
          memoryCache.set(cacheKey, data, cacheTTL)
        } catch (error) {
          console.warn('Impossible de mettre en cache la réponse:', error)
        }
      }

      // Compression (simulée avec header)
      if (enableCompression) {
        response.headers.set('X-Compression', 'enabled')
      }

      return response

    } catch (error) {
      const duration = Date.now() - startTime
      
      if (enableMetrics) {
        performanceMonitor.recordMetric(endpoint, method, duration, 500, false)
      }

      console.error(`Erreur performance ${method} ${endpoint}:`, error)
      
      const errorResponse = NextResponse.json(
        { error: 'Erreur interne du serveur' },
        { status: 500 }
      )
      
      errorResponse.headers.set('X-Response-Time', `${duration}ms`)
      
      return errorResponse
    }
  }
}

/**
 * Analyseur de performance automatique
 */
export class PerformanceAnalyzer {
  constructor() {
    this.analysisInterval = null
    this.recommendations = []
  }

  startAnalysis(intervalMs = 60000) { // Analyse toutes les minutes
    this.analysisInterval = setInterval(() => {
      this.analyze()
    }, intervalMs)
  }

  stopAnalysis() {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval)
      this.analysisInterval = null
    }
  }

  analyze() {
    const metrics = performanceMonitor.getMetrics()
    this.recommendations = []

    // Analyser les endpoints lents
    const slowEndpoints = metrics.slowestEndpoints.filter(e => e.averageDuration > 500)
    if (slowEndpoints.length > 0) {
      this.recommendations.push({
        type: 'performance',
        severity: 'high',
        message: `${slowEndpoints.length} endpoints lents détectés`,
        details: slowEndpoints.map(e => `${e.endpoint}: ${e.averageDuration.toFixed(0)}ms`),
        suggestion: 'Optimiser les requêtes SQL, ajouter des index, ou implémenter du cache'
      })
    }

    // Analyser les taux d'erreur élevés
    const highErrorEndpoints = metrics.topEndpoints.filter(e => 
      parseFloat(e.errorRate) > 5
    )
    if (highErrorEndpoints.length > 0) {
      this.recommendations.push({
        type: 'reliability',
        severity: 'medium',
        message: `${highErrorEndpoints.length} endpoints avec taux d'erreur élevé`,
        details: highErrorEndpoints.map(e => `${e.endpoint}: ${e.errorRate}`),
        suggestion: 'Vérifier la validation des données et la gestion d\'erreurs'
      })
    }

    // Analyser l'efficacité du cache
    const lowCacheEndpoints = metrics.topEndpoints.filter(e => 
      parseFloat(e.cacheHitRate) < 30 && e.count > 10
    )
    if (lowCacheEndpoints.length > 0) {
      this.recommendations.push({
        type: 'cache',
        severity: 'low',
        message: `${lowCacheEndpoints.length} endpoints avec faible taux de cache`,
        details: lowCacheEndpoints.map(e => `${e.endpoint}: ${e.cacheHitRate}`),
        suggestion: 'Augmenter la durée de cache ou améliorer la stratégie de cache'
      })
    }

    // Log des recommandations importantes
    const highSeverity = this.recommendations.filter(r => r.severity === 'high')
    if (highSeverity.length > 0) {
      console.warn('🔍 Recommandations de performance importantes:', highSeverity)
    }
  }

  getRecommendations() {
    return this.recommendations
  }
}

// Instance globale de l'analyseur
export const performanceAnalyzer = new PerformanceAnalyzer()

/**
 * Optimiseur automatique de cache
 */
export class CacheOptimizer {
  constructor() {
    this.optimizationRules = new Map()
  }

  addRule(pattern, ttl, condition = null) {
    this.optimizationRules.set(pattern, { ttl, condition })
  }

  getOptimalTTL(endpoint, responseData) {
    // TTL par défaut basé sur le type d'endpoint
    let baseTTL = 300000 // 5 minutes

    // Règles prédéfinies
    if (endpoint.includes('/services')) {
      baseTTL = 600000 // 10 minutes pour les services
    } else if (endpoint.includes('/stats')) {
      baseTTL = 180000 // 3 minutes pour les stats
    } else if (endpoint.includes('/orders')) {
      baseTTL = 60000 // 1 minute pour les commandes
    }

    // Appliquer les règles personnalisées
    for (const [pattern, rule] of this.optimizationRules) {
      if (endpoint.includes(pattern)) {
        if (!rule.condition || rule.condition(responseData)) {
          baseTTL = rule.ttl
          break
        }
      }
    }

    return baseTTL
  }

  shouldCache(endpoint, method, responseSize) {
    // Ne pas cacher les endpoints de modification
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      return false
    }

    // Ne pas cacher les réponses trop volumineuses
    if (responseSize > 1024 * 1024) { // 1MB
      return false
    }

    // Ne pas cacher les endpoints d'authentification
    if (endpoint.includes('/auth') || endpoint.includes('/login')) {
      return false
    }

    return true
  }
}

// Instance globale de l'optimiseur
export const cacheOptimizer = new CacheOptimizer()

/**
 * Utilitaires de performance
 */
export const performanceUtils = {
  // Mesurer le temps d'exécution d'une fonction
  async measureAsync(fn, label = 'Operation') {
    const start = performance.now()
    const result = await fn()
    const duration = performance.now() - start
    
    console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`)
    
    return { result, duration }
  },

  // Créer un debouncer
  debounce(fn, delay) {
    let timeoutId
    return (...args) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => fn.apply(this, args), delay)
    }
  },

  // Créer un throttler
  throttle(fn, delay) {
    let lastTime = 0
    return (...args) => {
      const now = Date.now()
      if (now - lastTime >= delay) {
        lastTime = now
        return fn.apply(this, args)
      }
    }
  },

  // Batching de requêtes
  createBatcher(batchFn, { maxBatchSize = 10, maxWaitTime = 100 } = {}) {
    let batch = []
    let timer = null

    const processBatch = async () => {
      if (batch.length === 0) return
      
      const currentBatch = batch.splice(0, maxBatchSize)
      try {
        await batchFn(currentBatch)
      } catch (error) {
        console.error('Erreur batch:', error)
      }
    }

    return (item) => {
      batch.push(item)

      // Traiter immédiatement si le batch est plein
      if (batch.length >= maxBatchSize) {
        if (timer) clearTimeout(timer)
        processBatch()
        return
      }

      // Programmer le traitement
      if (timer) clearTimeout(timer)
      timer = setTimeout(processBatch, maxWaitTime)
    }
  }
}

/**
 * Hook React pour monitoring des performances côté client
 */
export function usePerformanceMonitoring(componentName) {
  useEffect(() => {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      // Log des composants lents
      if (renderTime > 16) {
        console.warn(`🐌 Composant lent: ${componentName} - ${renderTime.toFixed(2)}ms`)
      }

      // Envoyer les métriques (en production, envoyer à un service d'analytics)
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'component_performance', {
          component_name: componentName,
          render_time: renderTime
        })
      }
    }
  }, [componentName])
}

/**
 * Initialisation du système de performance
 */
export function initializePerformanceSystem() {
  // Démarrer l'analyse automatique
  performanceAnalyzer.startAnalysis()

  // Configurer les règles d'optimisation du cache
  cacheOptimizer.addRule('/services', 600000) // 10 minutes
  cacheOptimizer.addRule('/platforms', 900000) // 15 minutes
  cacheOptimizer.addRule('/stats', 180000) // 3 minutes

  console.log('🚀 Système de performance initialisé')
}

/**
 * API endpoint pour les métriques de performance
 */
export function createPerformanceAPI() {
  return {
    getMetrics: () => performanceMonitor.getMetrics(),
    getRecommendations: () => performanceAnalyzer.getRecommendations(),
    getCacheStats: () => memoryCache.getStats(),
    reset: () => {
      performanceMonitor.reset()
      memoryCache.clear()
    }
  }
}
