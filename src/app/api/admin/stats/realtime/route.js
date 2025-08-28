/**
 * API pour les statistiques en temps réel
 */

import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"
import { errorHandler } from "@/lib/errors/errorHandler"
import { logger } from "@/lib/errors/logger"

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

    // await logger.info('Realtime stats requested', {
    //   requestId,
    //   userId: user.id
    // }) // Désactivé pour performance

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // Statistiques en temps réel
    const [
      activeUsers,
      todayOrders,
      todayRevenue,
      recentErrors,
      currentLoad
    ] = await Promise.all([
      // Utilisateurs actifs (connectés dans les 15 dernières minutes)
      supabase
        .from('user_sessions')
        .select('user_id')
        .gte('last_activity', new Date(now.getTime() - 15 * 60 * 1000).toISOString())
        .then(({ data }) => data?.length || 0),

      // Commandes d'aujourd'hui
      supabase
        .from('orders')
        .select('id')
        .gte('created_at', todayStart.toISOString())
        .then(({ data }) => data?.length || 0),

      // Revenus d'aujourd'hui
      supabase
        .from('payment_transactions')
        .select('amount')
        .eq('status', 'ACCEPTED')
        .gte('created_at', todayStart.toISOString())
        .then(({ data }) => 
          data?.reduce((sum, transaction) => sum + (transaction.amount || 0), 0) || 0
        ),

      // Erreurs récentes (dernière heure)
      supabase
        .from('error_logs')
        .select('id, severity')
        .gte('created_at', new Date(now.getTime() - 60 * 60 * 1000).toISOString())
        .then(({ data }) => data || []),

      // Charge système actuelle (approximative basée sur les requêtes)
      supabase
        .from('api_logs')
        .select('id')
        .gte('created_at', new Date(now.getTime() - 5 * 60 * 1000).toISOString())
        .then(({ data }) => data?.length || 0)
    ])

    // Calcul du taux d'erreur
    const totalRequests = Math.max(currentLoad, 1)
    const errorRate = (recentErrors.length / totalRequests) * 100

    // Calcul des tendances (comparaison avec l'heure précédente)
    const previousHourStart = new Date(now.getTime() - 60 * 60 * 1000)
    const currentHourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours())

    const [
      previousHourOrders,
      previousHourRevenue
    ] = await Promise.all([
      supabase
        .from('orders')
        .select('id')
        .gte('created_at', previousHourStart.toISOString())
        .lt('created_at', currentHourStart.toISOString())
        .then(({ data }) => data?.length || 0),

      supabase
        .from('payment_transactions')
        .select('amount')
        .eq('status', 'ACCEPTED')
        .gte('created_at', previousHourStart.toISOString())
        .lt('created_at', currentHourStart.toISOString())
        .then(({ data }) => 
          data?.reduce((sum, transaction) => sum + (transaction.amount || 0), 0) || 0
        )
    ])

    // Commandes de l'heure actuelle
    const currentHourOrders = await supabase
      .from('orders')
      .select('id')
      .gte('created_at', currentHourStart.toISOString())
      .then(({ data }) => data?.length || 0)

    const currentHourRevenue = await supabase
      .from('payment_transactions')
      .select('amount')
      .eq('status', 'ACCEPTED')
      .gte('created_at', currentHourStart.toISOString())
      .then(({ data }) => 
        data?.reduce((sum, transaction) => sum + (transaction.amount || 0), 0) || 0
      )

    // Calcul des tendances
    const ordersTrend = previousHourOrders > 0 ? 
      ((currentHourOrders - previousHourOrders) / previousHourOrders) * 100 : 0
    
    const revenueTrend = previousHourRevenue > 0 ? 
      ((currentHourRevenue - previousHourRevenue) / previousHourRevenue) * 100 : 0

    // Alertes système
    const systemAlerts = []
    
    if (errorRate > 5) {
      systemAlerts.push({
        type: 'error_rate',
        severity: 'high',
        message: `Taux d'erreur élevé: ${errorRate.toFixed(2)}%`
      })
    }

    if (activeUsers > 100) {
      systemAlerts.push({
        type: 'high_load',
        severity: 'medium',
        message: `Charge élevée: ${activeUsers} utilisateurs actifs`
      })
    }

    // Services externes status - désactivé pour performance
    const externalServices = {
      // supabase: 'operational',
      // cinetpay: 'operational',
      // email: 'operational'
    }

    const data = {
      activeUsers,
      todayOrders,
      todayRevenue,
      errorRate: parseFloat(errorRate.toFixed(2)),
      systemLoad: Math.min((currentLoad / 100) * 100, 100), // Pourcentage
      trends: {
        orders: parseFloat(ordersTrend.toFixed(1)),
        revenue: parseFloat(revenueTrend.toFixed(1))
      },
      alerts: systemAlerts,
      services: externalServices,
      lastUpdated: now.toISOString(),
      
      // Métriques détaillées
      metrics: {
        totalErrors: recentErrors.length,
        criticalErrors: recentErrors.filter(e => e.severity === 'critical').length,
        avgResponseTime: Math.round(Math.random() * 200 + 100), // Mock - intégrer avec monitoring réel
        uptime: 99.9, // Mock - intégrer avec monitoring réel
        
        // Répartition des erreurs par type
        errorsByType: recentErrors.reduce((acc, error) => {
          acc[error.type] = (acc[error.type] || 0) + 1
          return acc
        }, {}),
        
        // Performance - désactivé pour optimisation
        // performance: {
        //   databaseQueries: Math.round(Math.random() * 50 + 20),
        //   cacheHitRate: Math.round(Math.random() * 20 + 80),
        //   memoryUsage: Math.round(Math.random() * 30 + 40)
        // }
      }
    }

    return NextResponse.json({
      success: true,
      data,
      timestamp: now.toISOString()
    })

  }, {
    requestId,
    endpoint: '/api/admin/stats/realtime',
    method: 'GET',
    metadata: { operation: 'realtime_stats' }
  })
}
