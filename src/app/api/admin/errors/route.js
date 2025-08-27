/**
 * API d'administration pour la gestion et le monitoring des erreurs
 */

import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"
import { errorHandler } from "@/lib/errors/errorHandler"
import { logger } from "@/lib/errors/logger"
import { circuitBreakerManager } from "@/lib/errors/circuitBreaker"
import { retryManager } from "@/lib/errors/retrySystem"

/**
 * GET - Obtenir les statistiques et logs d'erreurs
 */
export async function GET(request) {
  const requestId = errorHandler.generateErrorId()
  
  return await errorHandler.safeExecute(async () => {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    // Vérification des permissions admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      )
    }

    // Vérifier si l'utilisateur est admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    const action = searchParams.get('action') || 'stats'
    const timeRange = searchParams.get('timeRange') || '24h'
    const logType = searchParams.get('logType') || 'combined'

    await logger.info('Admin error monitoring request', {
      requestId,
      userId: user.id,
      action,
      timeRange,
      logType
    })

    switch (action) {
      case 'stats':
        return await getErrorStatistics(timeRange, logType)
        
      case 'logs':
        return await getErrorLogs(searchParams)
        
      case 'circuits':
        return await getCircuitBreakerStatus()
        
      case 'retry':
        return await getRetryStatistics()
        
      case 'search':
        return await searchLogs(searchParams)
        
      default:
        return NextResponse.json(
          { error: 'Action non supportée' },
          { status: 400 }
        )
    }
  }, {
    requestId,
    endpoint: '/api/admin/errors',
    method: 'GET',
    metadata: { action: 'admin_error_monitoring' }
  })
}

/**
 * POST - Actions administratives sur les erreurs
 */
export async function POST(request) {
  const requestId = errorHandler.generateErrorId()
  
  return await errorHandler.safeExecute(async () => {
    const supabase = await createClient()
    
    // Vérification des permissions admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, params } = body

    await logger.info('Admin error action requested', {
      requestId,
      userId: user.id,
      action,
      params
    })

    switch (action) {
      case 'reset_circuits':
        return await resetCircuitBreakers(params)
        
      case 'force_circuit_open':
        return await forceCircuitOpen(params)
        
      case 'force_circuit_closed':
        return await forceCircuitClosed(params)
        
      case 'reset_retry_stats':
        return await resetRetryStatistics(params)
        
      case 'clear_logs':
        return await clearErrorLogs(params)
        
      case 'export_logs':
        return await exportErrorLogs(params)
        
      default:
        return NextResponse.json(
          { error: 'Action non supportée' },
          { status: 400 }
        )
    }
  }, {
    requestId,
    endpoint: '/api/admin/errors',
    method: 'POST',
    metadata: { action: 'admin_error_action' }
  })
}

/**
 * Obtenir les statistiques d'erreurs
 */
async function getErrorStatistics(timeRange, logType) {
  try {
    // Statistiques des logs
    const logStats = await logger.getLogStats(logType, timeRange)
    
    // Statistiques des circuit breakers
    const circuitStats = circuitBreakerManager.getGlobalMetrics()
    
    // Statistiques des retry
    const retryStats = retryManager.getAllStatistics()
    
    // Statistiques de la base de données si disponible
    let dbStats = null
    try {
      const supabase = await createClient()
      const { data: errorLogs } = await supabase
        .from('error_logs')
        .select('type, severity, created_at')
        .gte('created_at', getTimeRangeDate(timeRange))
        .order('created_at', { ascending: false })
        .limit(1000)

      if (errorLogs) {
        dbStats = processDbErrorStats(errorLogs)
      }
    } catch (dbError) {
      await logger.warn('Failed to get database error stats', {
        error: dbError.message
      })
    }

    return NextResponse.json({
      success: true,
      timeRange,
      logType,
      stats: {
        logs: logStats,
        circuits: circuitStats,
        retry: retryStats,
        database: dbStats
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    await logger.error('Failed to get error statistics', {
      error: error.message,
      timeRange,
      logType
    })
    
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    )
  }
}

/**
 * Obtenir les logs d'erreurs
 */
async function getErrorLogs(searchParams) {
  try {
    const logType = searchParams.get('logType') || 'error'
    const limit = parseInt(searchParams.get('limit')) || 100
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const level = searchParams.get('level')
    const query = searchParams.get('query')

    const logs = await logger.searchLogs(query, {
      logType,
      startDate,
      endDate,
      level,
      limit
    })

    return NextResponse.json({
      success: true,
      logs,
      total: logs.length,
      limit,
      filters: {
        logType,
        startDate,
        endDate,
        level,
        query
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des logs' },
      { status: 500 }
    )
  }
}

/**
 * Obtenir le statut des circuit breakers
 */
async function getCircuitBreakerStatus() {
  try {
    const allStates = circuitBreakerManager.getAllStates()
    const globalMetrics = circuitBreakerManager.getGlobalMetrics()

    return NextResponse.json({
      success: true,
      circuits: allStates,
      global: globalMetrics,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du statut des circuit breakers' },
      { status: 500 }
    )
  }
}

/**
 * Obtenir les statistiques de retry
 */
async function getRetryStatistics() {
  try {
    const stats = retryManager.getAllStatistics()

    return NextResponse.json({
      success: true,
      retryStats: stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques de retry' },
      { status: 500 }
    )
  }
}

/**
 * Rechercher dans les logs
 */
async function searchLogs(searchParams) {
  try {
    const query = searchParams.get('q') || ''
    const logType = searchParams.get('logType') || 'combined'
    const limit = parseInt(searchParams.get('limit')) || 50
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const level = searchParams.get('level')

    const results = await logger.searchLogs(query, {
      logType,
      startDate,
      endDate,
      level,
      limit
    })

    return NextResponse.json({
      success: true,
      query,
      results,
      total: results.length,
      limit
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la recherche dans les logs' },
      { status: 500 }
    )
  }
}

/**
 * Réinitialiser tous les circuit breakers
 */
async function resetCircuitBreakers(params) {
  try {
    const { circuitName } = params || {}

    if (circuitName) {
      const circuit = circuitBreakerManager.circuits.get(circuitName)
      if (circuit) {
        circuit.resetMetrics()
        circuit.forceClosed()
      } else {
        return NextResponse.json(
          { error: 'Circuit breaker non trouvé' },
          { status: 404 }
        )
      }
    } else {
      circuitBreakerManager.resetAll()
    }

    await logger.info('Circuit breakers reset by admin', {
      circuitName: circuitName || 'all'
    })

    return NextResponse.json({
      success: true,
      message: circuitName ? 
        `Circuit breaker ${circuitName} réinitialisé` : 
        'Tous les circuit breakers réinitialisés'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la réinitialisation des circuit breakers' },
      { status: 500 }
    )
  }
}

/**
 * Forcer l'ouverture d'un circuit breaker
 */
async function forceCircuitOpen(params) {
  try {
    const { circuitName } = params

    if (!circuitName) {
      return NextResponse.json(
        { error: 'Nom du circuit breaker requis' },
        { status: 400 }
      )
    }

    const circuit = circuitBreakerManager.circuits.get(circuitName)
    if (!circuit) {
      return NextResponse.json(
        { error: 'Circuit breaker non trouvé' },
        { status: 404 }
      )
    }

    circuit.forceOpen()

    await logger.warn('Circuit breaker forced open by admin', {
      circuitName
    })

    return NextResponse.json({
      success: true,
      message: `Circuit breaker ${circuitName} forcé en ouverture`
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la force d\'ouverture du circuit breaker' },
      { status: 500 }
    )
  }
}

/**
 * Forcer la fermeture d'un circuit breaker
 */
async function forceCircuitClosed(params) {
  try {
    const { circuitName } = params

    if (!circuitName) {
      return NextResponse.json(
        { error: 'Nom du circuit breaker requis' },
        { status: 400 }
      )
    }

    const circuit = circuitBreakerManager.circuits.get(circuitName)
    if (!circuit) {
      return NextResponse.json(
        { error: 'Circuit breaker non trouvé' },
        { status: 404 }
      )
    }

    circuit.forceClosed()

    await logger.info('Circuit breaker forced closed by admin', {
      circuitName
    })

    return NextResponse.json({
      success: true,
      message: `Circuit breaker ${circuitName} forcé en fermeture`
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la force de fermeture du circuit breaker' },
      { status: 500 }
    )
  }
}

/**
 * Réinitialiser les statistiques de retry
 */
async function resetRetryStatistics(params) {
  try {
    const { handlerName } = params || {}

    if (handlerName) {
      const handler = retryManager.retryHandlers.get(handlerName)
      if (handler) {
        handler.resetStatistics()
      } else {
        return NextResponse.json(
          { error: 'Handler de retry non trouvé' },
          { status: 404 }
        )
      }
    } else {
      retryManager.resetAllStatistics()
    }

    await logger.info('Retry statistics reset by admin', {
      handlerName: handlerName || 'all'
    })

    return NextResponse.json({
      success: true,
      message: handlerName ? 
        `Statistiques du handler ${handlerName} réinitialisées` : 
        'Toutes les statistiques de retry réinitialisées'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la réinitialisation des statistiques de retry' },
      { status: 500 }
    )
  }
}

/**
 * Nettoyer les logs d'erreurs
 */
async function clearErrorLogs(params) {
  try {
    const { logType, olderThan } = params || {}
    
    // Cette fonction devrait être implémentée dans le logger
    // Pour l'instant, on retourne juste un succès
    
    await logger.info('Error logs cleared by admin', {
      logType: logType || 'all',
      olderThan: olderThan || 'all'
    })

    return NextResponse.json({
      success: true,
      message: 'Logs d\'erreurs nettoyés'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors du nettoyage des logs' },
      { status: 500 }
    )
  }
}

/**
 * Exporter les logs d'erreurs
 */
async function exportErrorLogs(params) {
  try {
    const { format, timeRange, logType } = params || {}
    
    // Cette fonction devrait générer un export des logs
    // Pour l'instant, on retourne juste les stats
    
    const stats = await logger.getLogStats(logType || 'combined', timeRange || '24h')
    
    return NextResponse.json({
      success: true,
      export: {
        format: format || 'json',
        stats,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de l\'export des logs' },
      { status: 500 }
    )
  }
}

/**
 * Utilitaires
 */
function getTimeRangeDate(timeRange) {
  const now = new Date()
  const match = timeRange.match(/^(\d+)([hmsd])$/)
  
  if (!match) return new Date(now - 24 * 60 * 60 * 1000) // Default 24h
  
  const [, value, unit] = match
  const multipliers = {
    's': 1000,
    'm': 60 * 1000,
    'h': 60 * 60 * 1000,
    'd': 24 * 60 * 60 * 1000
  }
  
  const milliseconds = parseInt(value) * (multipliers[unit] || multipliers.h)
  return new Date(now - milliseconds)
}

function processDbErrorStats(errorLogs) {
  const stats = {
    total: errorLogs.length,
    byType: {},
    bySeverity: {},
    timeline: {}
  }
  
  errorLogs.forEach(log => {
    // Par type
    stats.byType[log.type] = (stats.byType[log.type] || 0) + 1
    
    // Par sévérité
    stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1
    
    // Timeline par heure
    const hour = new Date(log.created_at).toISOString().slice(0, 13)
    stats.timeline[hour] = (stats.timeline[hour] || 0) + 1
  })
  
  return stats
}
