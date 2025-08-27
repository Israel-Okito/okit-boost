// Système de cache avancé pour Next.js
import { unstable_cache } from 'next/cache'

/**
 * Configuration du cache
 */
const CACHE_CONFIG = {
  services: {
    ttl: 300, // 5 minutes
    tags: ['services']
  },
  platforms: {
    ttl: 600, // 10 minutes
    tags: ['platforms']
  },
  orders: {
    ttl: 60, // 1 minute
    tags: ['orders']
  },
  payments: {
    ttl: 30, // 30 secondes
    tags: ['payments']
  },
  stats: {
    ttl: 180, // 3 minutes
    tags: ['stats']
  }
}

/**
 * Cache en mémoire pour les données fréquemment accédées
 */
class MemoryCache {
  constructor() {
    this.cache = new Map()
    this.timers = new Map()
  }

  set(key, value, ttl = 300000) { // TTL par défaut: 5 minutes
    // Nettoyer l'ancien timer s'il existe
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key))
    }

    // Stocker la valeur
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    })

    // Programmer la suppression
    const timer = setTimeout(() => {
      this.cache.delete(key)
      this.timers.delete(key)
    }, ttl)

    this.timers.set(key, timer)
  }

  get(key) {
    const cached = this.cache.get(key)
    if (!cached) return null

    // Vérifier l'expiration
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key)
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key))
        this.timers.delete(key)
      }
      return null
    }

    return cached.value
  }

  delete(key) {
    this.cache.delete(key)
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key))
      this.timers.delete(key)
    }
  }

  clear() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer)
    }
    this.cache.clear()
    this.timers.clear()
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      memoryUsage: JSON.stringify(Array.from(this.cache.values())).length
    }
  }
}

// Instance globale du cache mémoire
export const memoryCache = new MemoryCache()

/**
 * Cache wrapper pour les fonctions
 */
export function withCache(key, fn, options = {}) {
  const { ttl = 300000, useMemory = true, tags = [] } = options

  return async (...args) => {
    const cacheKey = `${key}_${JSON.stringify(args)}`

    // Essayer le cache mémoire d'abord
    if (useMemory) {
      const cached = memoryCache.get(cacheKey)
      if (cached) {
        console.log(`Cache HIT (memory): ${cacheKey}`)
        return cached
      }
    }

    // Exécuter la fonction
    console.log(`Cache MISS: ${cacheKey}`)
    const result = await fn(...args)

    // Stocker en cache mémoire
    if (useMemory && result) {
      memoryCache.set(cacheKey, result, ttl)
    }

    return result
  }
}

/**
 * Cache Next.js avec revalidation
 */
export function createNextCache(key, fn, options = {}) {
  const config = CACHE_CONFIG[key] || { ttl: 300, tags: [] }
  const { ttl = config.ttl, tags = config.tags } = options

  return unstable_cache(
    fn,
    [key],
    {
      revalidate: ttl,
      tags
    }
  )
}

/**
 * Cache spécialisé pour les services
 */
export const cachedServices = {
  // Obtenir tous les services d'une plateforme
  getByPlatform: createNextCache(
    'services_by_platform',
    async (platformId, supabase) => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('platform_id', platformId)
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      return data
    },
    { ttl: 300, tags: ['services'] }
  ),

  // Obtenir service par ID
  getById: withCache(
    'service_by_id',
    async (serviceId, supabase) => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .single()

      if (error) throw error
      return data
    },
    { ttl: 600000 } // 10 minutes
  ),

  // Obtenir les services populaires
  getPopular: createNextCache(
    'popular_services',
    async (supabase, limit = 10) => {
      const { data, error } = await supabase
        .from('services')
        .select('*, orders_count:order_items(count)')
        .eq('is_active', true)
        .order('orders_count', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data
    },
    { ttl: 180, tags: ['services', 'stats'] }
  )
}

/**
 * Cache pour les plateformes
 */
export const cachedPlatforms = {
  // Toutes les plateformes actives
  getAll: createNextCache(
    'all_platforms',
    async (supabase) => {
      const { data, error } = await supabase
        .from('platforms')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      return data
    },
    { ttl: 600, tags: ['platforms'] }
  ),

  // Plateforme avec statistiques
  getWithStats: createNextCache(
    'platforms_with_stats',
    async (supabase) => {
      const { data, error } = await supabase
        .from('platforms')
        .select(`
          *,
          services_count:services(count),
          orders_count:services(order_items(count))
        `)
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      return data
    },
    { ttl: 300, tags: ['platforms', 'services', 'stats'] }
  )
}

/**
 * Cache pour les statistiques
 */
export const cachedStats = {
  // Statistiques générales
  getGeneral: createNextCache(
    'general_stats',
    async (supabase) => {
      const [
        { count: totalOrders },
        { count: totalUsers },
        { count: totalServices },
        { data: recentOrders }
      ] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('services').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('orders').select('total_cdf, created_at').order('created_at', { ascending: false }).limit(100)
      ])

      // Calculer le chiffre d'affaires
      const totalRevenue = recentOrders?.reduce((sum, order) => sum + (order.total_cdf || 0), 0) || 0

      return {
        totalOrders,
        totalUsers,
        totalServices,
        totalRevenue,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        lastUpdated: new Date().toISOString()
      }
    },
    { ttl: 180, tags: ['stats'] }
  ),

  // Statistiques par période
  getByPeriod: withCache(
    'stats_by_period',
    async (period, supabase) => {
      const now = new Date()
      let startDate = new Date()

      switch (period) {
        case 'today':
          startDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          startDate.setDate(now.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(now.getMonth() - 1)
          break
        default:
          startDate.setDate(now.getDate() - 7)
      }

      const { data, error } = await supabase
        .from('orders')
        .select('total_cdf, status, created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at')

      if (error) throw error

      // Traitement des données
      const stats = {
        totalOrders: data.length,
        totalRevenue: data.reduce((sum, order) => sum + (order.total_cdf || 0), 0),
        paidOrders: data.filter(order => order.status === 'completed').length,
        pendingOrders: data.filter(order => order.status === 'pending').length,
        period,
        startDate: startDate.toISOString(),
        endDate: now.toISOString()
      }

      return stats
    },
    { ttl: 120000 } // 2 minutes
  )
}

/**
 * Système de cache pour les requêtes utilisateur
 */
export const userCache = {
  // Cache des commandes utilisateur
  getUserOrders: withCache(
    'user_orders',
    async (userId, supabase) => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            services (name, platform_id)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    { ttl: 60000 } // 1 minute
  ),

  // Cache du profil utilisateur
  getUserProfile: withCache(
    'user_profile',
    async (userId, supabase) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      return data
    },
    { ttl: 300000 } // 5 minutes
  )
}

/**
 * Invalidation du cache
 */
export function invalidateCache(patterns = []) {
  // Invalidation du cache mémoire
  if (patterns.length === 0) {
    memoryCache.clear()
    console.log('Cache mémoire entièrement vidé')
  } else {
    const keys = Array.from(memoryCache.cache.keys())
    for (const pattern of patterns) {
      const matchingKeys = keys.filter(key => key.includes(pattern))
      for (const key of matchingKeys) {
        memoryCache.delete(key)
      }
    }
    console.log(`Cache invalidé pour les patterns: ${patterns.join(', ')}`)
  }
}

/**
 * Middleware de cache pour les API routes
 */
export function withAPICache(handler, options = {}) {
  const { ttl = 300, key } = options

  return async (request) => {
    const cacheKey = key || `api_${request.url}_${request.method}`

    // Pour les requêtes GET uniquement
    if (request.method === 'GET') {
      const cached = memoryCache.get(cacheKey)
      if (cached) {
        console.log(`API Cache HIT: ${cacheKey}`)
        return new Response(JSON.stringify(cached), {
          headers: {
            'Content-Type': 'application/json',
            'X-Cache': 'HIT'
          }
        })
      }
    }

    // Exécuter le handler
    const response = await handler(request)
    
    // Mettre en cache si c'est un succès
    if (request.method === 'GET' && response.ok) {
      try {
        const data = await response.clone().json()
        memoryCache.set(cacheKey, data, ttl * 1000)
        console.log(`API Cache SET: ${cacheKey}`)
      } catch (error) {
        console.warn('Impossible de mettre en cache la réponse:', error)
      }
    }

    // Ajouter header de cache
    response.headers.set('X-Cache', 'MISS')
    
    return response
  }
}

/**
 * Préchargement intelligent du cache
 */
export async function preloadCache(supabase) {
  console.log('Préchargement du cache en cours...')
  
  try {
    // Précharger les données essentielles
    await Promise.all([
      cachedPlatforms.getAll(supabase),
      cachedStats.getGeneral(supabase),
      cachedServices.getPopular(supabase)
    ])
    
    console.log('Cache préchargé avec succès')
  } catch (error) {
    console.error('Erreur préchargement cache:', error)
  }
}

/**
 * Monitoring du cache
 */
export function getCacheStats() {
  return {
    memory: memoryCache.getStats(),
    timestamp: new Date().toISOString()
  }
}
