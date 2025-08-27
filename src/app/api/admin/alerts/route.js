/**
 * API pour la gestion des alertes système
 */

import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"
import { errorHandler } from "@/lib/errors/errorHandler"
import { logger } from "@/lib/errors/logger"
import { circuitBreakerManager } from "@/lib/errors/circuitBreaker"

export async function GET(request) {
  const requestId = errorHandler.generateErrorId()
  
  return await errorHandler.safeExecute(async () => {
    const supabase = await createClient()
    
    // Vérification de l'authentification et des permissions admin
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

    await logger.info('System alerts requested', {
      requestId,
      userId: user.id
    })

    const now = new Date()
    const alerts = []

    try {
      // 1. Vérifier les circuit breakers ouverts
      const circuitStates = circuitBreakerManager.getAllStates()
      Object.entries(circuitStates).forEach(([name, state]) => {
        if (state.state === 'OPEN') {
          alerts.push({
            id: `circuit_${name}`,
            type: 'circuit_breaker',
            severity: 'critical',
            title: 'Circuit Breaker Ouvert',
            message: `Le circuit "${name}" est ouvert depuis ${Math.round((now - new Date(state.lastStateChange)) / 60000)} minutes`,
            timestamp: state.lastStateChange,
            data: {
              circuitName: name,
              failures: state.failures,
              timeSinceOpen: now - new Date(state.lastStateChange)
            },
            actions: ['reset_circuit', 'view_details']
          })
        }
      })

      // 2. Vérifier le taux d'erreur élevé (dernière heure)
      const lastHour = new Date(now.getTime() - 60 * 60 * 1000)
      const { data: recentErrors } = await supabase
        .from('error_logs')
        .select('id, severity, type')
        .gte('created_at', lastHour.toISOString())

      if (recentErrors && recentErrors.length > 10) {
        const criticalErrors = recentErrors.filter(e => e.severity === 'critical').length
        
        alerts.push({
          id: 'high_error_rate',
          type: 'error_rate',
          severity: criticalErrors > 5 ? 'critical' : 'warning',
          title: 'Taux d\'erreur élevé',
          message: `${recentErrors.length} erreurs dans la dernière heure (${criticalErrors} critiques)`,
          timestamp: now.toISOString(),
          data: {
            totalErrors: recentErrors.length,
            criticalErrors,
            errorTypes: recentErrors.reduce((acc, error) => {
              acc[error.type] = (acc[error.type] || 0) + 1
              return acc
            }, {})
          },
          actions: ['view_errors', 'export_logs']
        })
      }

      // 3. Vérifier les paiements échoués (dernières 24h)
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const { data: failedPayments } = await supabase
        .from('payment_transactions')
        .select('id, amount, currency, created_at')
        .in('status', ['REFUSED', 'CANCELLED', 'FAILED'])
        .gte('created_at', last24h.toISOString())

      if (failedPayments && failedPayments.length > 5) {
        const totalLost = failedPayments.reduce((sum, payment) => 
          sum + (payment.amount || 0), 0
        )
        
        alerts.push({
          id: 'failed_payments',
          type: 'payment',
          severity: failedPayments.length > 20 ? 'critical' : 'warning',
          title: 'Paiements échoués',
          message: `${failedPayments.length} paiements ont échoué (${totalLost.toFixed(2)} USD perdus)`,
          timestamp: failedPayments[0]?.created_at || now.toISOString(),
          data: {
            count: failedPayments.length,
            totalLost,
            recentFailures: failedPayments.slice(0, 5)
          },
          actions: ['view_payments', 'retry_payments']
        })
      }

      // 4. Vérifier les commandes bloquées
      const { data: stuckOrders } = await supabase
        .from('orders')
        .select('id, order_number, status, created_at')
        .eq('status', 'processing')
        .lt('created_at', new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()) // Plus de 2h

      if (stuckOrders && stuckOrders.length > 0) {
        alerts.push({
          id: 'stuck_orders',
          type: 'orders',
          severity: 'warning',
          title: 'Commandes bloquées',
          message: `${stuckOrders.length} commandes sont en traitement depuis plus de 2 heures`,
          timestamp: stuckOrders[0]?.created_at || now.toISOString(),
          data: {
            count: stuckOrders.length,
            orders: stuckOrders.slice(0, 5)
          },
          actions: ['view_orders', 'manual_review']
        })
      }

      // 5. Vérifier l'espace disque (simulation - à adapter selon votre infrastructure)
      const diskUsage = Math.random() * 100 // Mock - intégrer avec monitoring réel
      if (diskUsage > 85) {
        alerts.push({
          id: 'disk_space',
          type: 'system',
          severity: diskUsage > 95 ? 'critical' : 'warning',
          title: 'Espace disque faible',
          message: `Utilisation du disque: ${diskUsage.toFixed(1)}%`,
          timestamp: now.toISOString(),
          data: {
            usage: diskUsage,
            threshold: 85
          },
          actions: ['cleanup_logs', 'expand_storage']
        })
      }

      // 6. Vérifier les services externes
      const externalServicesStatus = await checkExternalServices()
      externalServicesStatus.forEach(service => {
        if (service.status !== 'operational') {
          alerts.push({
            id: `service_${service.name}`,
            type: 'external_service',
            severity: service.status === 'down' ? 'critical' : 'warning',
            title: `Service externe ${service.name}`,
            message: `${service.name} est ${service.status} (${service.responseTime}ms)`,
            timestamp: now.toISOString(),
            data: {
              serviceName: service.name,
              status: service.status,
              responseTime: service.responseTime,
              lastCheck: service.lastCheck
            },
            actions: ['retry_check', 'view_status']
          })
        }
      })

      // 7. Vérifier les métriques de performance
      const performanceIssues = await checkPerformanceMetrics()
      performanceIssues.forEach(issue => {
        alerts.push({
          id: `perf_${issue.type}`,
          type: 'performance',
          severity: issue.severity,
          title: `Performance: ${issue.title}`,
          message: issue.message,
          timestamp: now.toISOString(),
          data: issue.data,
          actions: issue.actions
        })
      })

      // Trier les alertes par sévérité et timestamp
      alerts.sort((a, b) => {
        const severityOrder = { critical: 3, warning: 2, info: 1 }
        const severityDiff = (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0)
        
        if (severityDiff !== 0) return severityDiff
        
        return new Date(b.timestamp) - new Date(a.timestamp)
      })

      // Statistiques des alertes
      const alertStats = {
        total: alerts.length,
        critical: alerts.filter(a => a.severity === 'critical').length,
        warning: alerts.filter(a => a.severity === 'warning').length,
        info: alerts.filter(a => a.severity === 'info').length,
        byType: alerts.reduce((acc, alert) => {
          acc[alert.type] = (acc[alert.type] || 0) + 1
          return acc
        }, {})
      }

      return NextResponse.json({
        success: true,
        alerts,
        stats: alertStats,
        timestamp: now.toISOString()
      })

    } catch (error) {
      await logger.error('Failed to fetch system alerts', {
        requestId,
        error: error.message,
        stack: error.stack
      })

      return NextResponse.json(
        { error: 'Erreur lors de la récupération des alertes' },
        { status: 500 }
      )
    }

  }, {
    requestId,
    endpoint: '/api/admin/alerts',
    method: 'GET',
    metadata: { operation: 'system_alerts' }
  })
}

/**
 * Vérifier l'état des services externes
 */
async function checkExternalServices() {
  const services = [
    { name: 'supabase', url: process.env.NEXT_PUBLIC_SUPABASE_URL },
    { name: 'cinetpay', url: 'https://api-checkout.cinetpay.com' }
  ]

  const results = await Promise.allSettled(
    services.map(async (service) => {
      const startTime = Date.now()
      
      try {
        const response = await fetch(service.url, {
          method: 'HEAD',
          timeout: 5000
        })
        
        const responseTime = Date.now() - startTime
        
        return {
          name: service.name,
          status: response.ok ? 'operational' : 'degraded',
          responseTime,
          lastCheck: new Date().toISOString()
        }
      } catch (error) {
        return {
          name: service.name,
          status: 'down',
          responseTime: Date.now() - startTime,
          lastCheck: new Date().toISOString(),
          error: error.message
        }
      }
    })
  )

  return results.map(result => 
    result.status === 'fulfilled' ? result.value : {
      name: 'unknown',
      status: 'down',
      responseTime: 0,
      lastCheck: new Date().toISOString()
    }
  )
}

/**
 * Vérifier les métriques de performance
 */
async function checkPerformanceMetrics() {
  const issues = []
  
  // Simuler des vérifications de performance (à adapter selon votre monitoring)
  const avgResponseTime = Math.random() * 2000 + 200 // Mock
  const memoryUsage = Math.random() * 100 // Mock
  const cpuUsage = Math.random() * 100 // Mock
  
  if (avgResponseTime > 1000) {
    issues.push({
      type: 'response_time',
      severity: avgResponseTime > 2000 ? 'critical' : 'warning',
      title: 'Temps de réponse élevé',
      message: `Temps de réponse moyen: ${avgResponseTime.toFixed(0)}ms`,
      data: { avgResponseTime, threshold: 1000 },
      actions: ['optimize_queries', 'scale_resources']
    })
  }
  
  if (memoryUsage > 80) {
    issues.push({
      type: 'memory',
      severity: memoryUsage > 90 ? 'critical' : 'warning',
      title: 'Utilisation mémoire élevée',
      message: `Utilisation mémoire: ${memoryUsage.toFixed(1)}%`,
      data: { memoryUsage, threshold: 80 },
      actions: ['restart_services', 'scale_resources']
    })
  }
  
  if (cpuUsage > 85) {
    issues.push({
      type: 'cpu',
      severity: cpuUsage > 95 ? 'critical' : 'warning',
      title: 'Utilisation CPU élevée',
      message: `Utilisation CPU: ${cpuUsage.toFixed(1)}%`,
      data: { cpuUsage, threshold: 85 },
      actions: ['scale_resources', 'optimize_code']
    })
  }
  
  return issues
}

export async function POST(request) {
  const requestId = errorHandler.generateErrorId()
  
  return await errorHandler.safeExecute(async () => {
    const supabase = await createClient()
    
    // Vérification de l'authentification et des permissions admin
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

    const { action, alertId, data } = await request.json()

    await logger.info('Alert action requested', {
      requestId,
      userId: user.id,
      action,
      alertId
    })

    // Traiter les actions sur les alertes
    switch (action) {
      case 'dismiss':
        // Marquer l'alerte comme ignorée
        return NextResponse.json({
          success: true,
          message: 'Alerte ignorée'
        })
        
      case 'resolve':
        // Marquer l'alerte comme résolue
        return NextResponse.json({
          success: true,
          message: 'Alerte résolue'
        })
        
      case 'snooze':
        // Reporter l'alerte
        return NextResponse.json({
          success: true,
          message: 'Alerte reportée'
        })
        
      default:
        return NextResponse.json(
          { error: 'Action non supportée' },
          { status: 400 }
        )
    }

  }, {
    requestId,
    endpoint: '/api/admin/alerts',
    method: 'POST',
    metadata: { operation: 'alert_action' }
  })
}
