// Optimiseur de requêtes SQL pour Supabase
import { memoryCache } from './cache'

/**
 * Classe pour optimiser les requêtes Supabase
 */
export class QueryOptimizer {
  constructor(supabase) {
    this.supabase = supabase
    this.queryStats = new Map()
  }

  /**
   * Exécuter une requête avec optimisations
   */
  async execute(query, options = {}) {
    const {
      cache = true,
      cacheTTL = 300000,
      cacheKey,
      profile = false,
      timeout = 30000
    } = options

    const startTime = Date.now()
    const queryKey = cacheKey || this.generateQueryKey(query)

    // Vérifier le cache si activé
    if (cache) {
      const cached = memoryCache.get(queryKey)
      if (cached) {
        this.recordQueryStats(queryKey, 0, true)
        return cached
      }
    }

    try {
      // Exécuter la requête avec timeout
      const result = await this.executeWithTimeout(query, timeout)
      const duration = Date.now() - startTime

      // Enregistrer les statistiques
      this.recordQueryStats(queryKey, duration, false)

      // Mettre en cache si succès
      if (cache && result.data && !result.error) {
        memoryCache.set(queryKey, result, cacheTTL)
      }

      // Log des requêtes lentes
      if (duration > 1000) {
        console.warn(`⚠️ Requête lente détectée: ${duration}ms`, {
          query: queryKey,
          duration
        })
      }

      return result
    } catch (error) {
      this.recordQueryStats(queryKey, Date.now() - startTime, false, error)
      throw error
    }
  }

  /**
   * Exécuter une requête avec timeout
   */
  async executeWithTimeout(query, timeout) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Requête timeout après ${timeout}ms`))
      }, timeout)

      query.then(result => {
        clearTimeout(timer)
        resolve(result)
      }).catch(error => {
        clearTimeout(timer)
        reject(error)
      })
    })
  }

  /**
   * Générer une clé unique pour la requête
   */
  generateQueryKey(query) {
    // Extraire les informations de la requête
    const queryString = query.toString ? query.toString() : JSON.stringify(query)
    return `query_${Buffer.from(queryString).toString('base64').substring(0, 32)}`
  }

  /**
   * Enregistrer les statistiques de requête
   */
  recordQueryStats(queryKey, duration, fromCache, error = null) {
    const stats = this.queryStats.get(queryKey) || {
      count: 0,
      totalDuration: 0,
      averageDuration: 0,
      cacheHits: 0,
      errors: 0,
      lastExecuted: null
    }

    stats.count++
    stats.lastExecuted = new Date().toISOString()

    if (fromCache) {
      stats.cacheHits++
    } else {
      stats.totalDuration += duration
      stats.averageDuration = stats.totalDuration / (stats.count - stats.cacheHits)
    }

    if (error) {
      stats.errors++
    }

    this.queryStats.set(queryKey, stats)
  }

  /**
   * Obtenir les statistiques de performance
   */
  getQueryStats() {
    const stats = Array.from(this.queryStats.entries()).map(([key, data]) => ({
      query: key,
      ...data,
      cacheHitRate: data.count > 0 ? (data.cacheHits / data.count * 100).toFixed(2) + '%' : '0%'
    }))

    return {
      totalQueries: stats.reduce((sum, s) => sum + s.count, 0),
      slowQueries: stats.filter(s => s.averageDuration > 1000),
      topQueriesByCount: stats.sort((a, b) => b.count - a.count).slice(0, 10),
      topQueriesByDuration: stats.sort((a, b) => b.averageDuration - a.averageDuration).slice(0, 10)
    }
  }
}

/**
 * Requêtes optimisées prêtes à l'emploi
 */
export const optimizedQueries = {
  /**
   * Obtenir les services avec pagination et filtres
   */
  getServices: async (supabase, options = {}) => {
    const {
      platformId,
      category,
      isActive = true,
      page = 1,
      limit = 20,
      orderBy = 'name',
      ascending = true
    } = options

    let query = supabase
      .from('services')
      .select(`
        id,
        name,
        description,
        price_usd,
        price_cdf,
        min_quantity,
        max_quantity,
        platform_id,
        category,
        is_active,
        delivery_time
      `)
      .eq('is_active', isActive)

    // Ajouter les filtres
    if (platformId) {
      query = query.eq('platform_id', platformId)
    }

    if (category) {
      query = query.eq('category', category)
    }

    // Ajouter l'ordre et la pagination
    query = query
      .order(orderBy, { ascending })
      .range((page - 1) * limit, page * limit - 1)

    return query
  },

  /**
   * Obtenir les commandes d'un utilisateur avec détails
   */
  getUserOrders: async (supabase, userId, options = {}) => {
    const {
      status,
      limit = 50,
      offset = 0,
      includeItems = true
    } = options

    let query = supabase
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        payment_status,
        total_usd,
        total_cdf,
        currency,
        created_at,
        updated_at,
        ${includeItems ? `
        order_items (
          id,
          service_name,
          platform_name,
          quantity,
          total_usd,
          total_cdf,
          target_link,
          services (
            id,
            name,
            platform_id
          )
        )` : ''}
      `)
      .eq('user_id', userId)

    if (status) {
      query = query.eq('status', status)
    }

    return query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
  },

  /**
   * Obtenir les statistiques de vente
   */
  getSalesStats: async (supabase, period = 'week') => {
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
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
    }

    return supabase
      .from('orders')
      .select(`
        id,
        total_cdf,
        status,
        payment_status,
        created_at::date,
        order_items (
          service_name,
          quantity
        )
      `)
      .gte('created_at', startDate.toISOString())
      .order('created_at')
  },

  /**
   * Recherche de services avec full-text search
   */
  searchServices: async (supabase, searchTerm, options = {}) => {
    const {
      platformId,
      limit = 20,
      minPrice,
      maxPrice
    } = options

    let query = supabase
      .from('services')
      .select(`
        id,
        name,
        description,
        price_usd,
        price_cdf,
        min_quantity,
        max_quantity,
        platform_id,
        category
      `)
      .eq('is_active', true)

    // Recherche textuelle
    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
    }

    // Filtres additionnels
    if (platformId) {
      query = query.eq('platform_id', platformId)
    }

    if (minPrice !== undefined) {
      query = query.gte('price_cdf', minPrice)
    }

    if (maxPrice !== undefined) {
      query = query.lte('price_cdf', maxPrice)
    }

    return query
      .order('name')
      .limit(limit)
  }
}

/**
 * Builder de requêtes pour éviter les N+1
 */
export class QueryBuilder {
  constructor(supabase) {
    this.supabase = supabase
    this.includes = []
    this.filters = []
    this.sorts = []
    this.paginationData = null
  }

  /**
   * Inclure des relations
   */
  include(relation, select = '*') {
    this.includes.push({ relation, select })
    return this
  }

  /**
   * Ajouter un filtre
   */
  where(field, operator, value) {
    this.filters.push({ field, operator, value })
    return this
  }

  /**
   * Ajouter un tri
   */
  orderBy(field, ascending = true) {
    this.sorts.push({ field, ascending })
    return this
  }

  /**
   * Ajouter la pagination
   */
  paginate(page, limit) {
    this.paginationData = { page, limit }
    return this
  }

  /**
   * Construire et exécuter la requête
   */
  async execute(table) {
    let selectClause = '*'
    
    // Construire la clause SELECT avec les relations
    if (this.includes.length > 0) {
      const relations = this.includes.map(inc => 
        `${inc.relation} (${inc.select})`
      ).join(', ')
      selectClause = `*, ${relations}`
    }

    let query = this.supabase
      .from(table)
      .select(selectClause)

    // Appliquer les filtres
    for (const filter of this.filters) {
      switch (filter.operator) {
        case 'eq':
          query = query.eq(filter.field, filter.value)
          break
        case 'neq':
          query = query.neq(filter.field, filter.value)
          break
        case 'gt':
          query = query.gt(filter.field, filter.value)
          break
        case 'gte':
          query = query.gte(filter.field, filter.value)
          break
        case 'lt':
          query = query.lt(filter.field, filter.value)
          break
        case 'lte':
          query = query.lte(filter.field, filter.value)
          break
        case 'like':
          query = query.ilike(filter.field, `%${filter.value}%`)
          break
        case 'in':
          query = query.in(filter.field, filter.value)
          break
      }
    }

    // Appliquer les tris
    for (const sort of this.sorts) {
      query = query.order(sort.field, { ascending: sort.ascending })
    }

    // Appliquer la pagination
    if (this.paginationData) {
      const { page, limit } = this.paginationData
      const start = (page - 1) * limit
      const end = start + limit - 1
      query = query.range(start, end)
    }

    return query
  }
}

/**
 * Utilitaires de performance pour les requêtes
 */
export const queryUtils = {
  /**
   * Batch loading pour éviter les N+1
   */
  async batchLoad(supabase, table, ids, field = 'id') {
    if (ids.length === 0) return []

    const { data, error } = await supabase
      .from(table)
      .select('*')
      .in(field, ids)

    if (error) throw error

    // Créer un map pour l'accès rapide
    const dataMap = new Map()
    data.forEach(item => {
      dataMap.set(item[field], item)
    })

    // Retourner dans l'ordre des IDs demandés
    return ids.map(id => dataMap.get(id)).filter(Boolean)
  },

  /**
   * Compter les enregistrements de manière optimisée
   */
  async count(supabase, table, filters = []) {
    let query = supabase
      .from(table)
      .select('*', { count: 'exact', head: true })

    // Appliquer les filtres
    for (const filter of filters) {
      query = query.eq(filter.field, filter.value)
    }

    const { count, error } = await query

    if (error) throw error
    return count
  },

  /**
   * Upsert optimisé avec gestion des conflits
   */
  async upsert(supabase, table, data, options = {}) {
    const {
      onConflict = 'id',
      ignoreDuplicates = false
    } = options

    return supabase
      .from(table)
      .upsert(data, {
        onConflict,
        ignoreDuplicates
      })
  }
}

/**
 * Middleware de monitoring des requêtes
 */
export function withQueryMonitoring(supabase) {
  const optimizer = new QueryOptimizer(supabase)

  // Wrapper pour intercepter les requêtes
  const originalFrom = supabase.from.bind(supabase)
  
  supabase.from = function(table) {
    const query = originalFrom(table)
    
    // Wrapper pour intercepter l'exécution
    const originalThen = query.then.bind(query)
    query.then = function(onFulfilled, onRejected) {
      return optimizer.execute(query, { cache: false })
        .then(onFulfilled, onRejected)
    }
    
    return query
  }

  return {
    supabase,
    optimizer,
    getStats: () => optimizer.getQueryStats()
  }
}
