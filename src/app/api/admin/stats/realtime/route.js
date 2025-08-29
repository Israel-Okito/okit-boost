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

    // Statistiques en temps réel (utilisation des tables existantes)
    const [
      activeUsers,
      todayOrders,
      todayRevenue,
      recentTransactions
    ] = await Promise.all([
      // Utilisateurs actifs approximatifs (basé sur les connexions récentes)
      supabase
        .from('profiles')
        .select('last_sign_in_at')
        .gte('last_sign_in_at', new Date(now.getTime() - 60 * 60 * 1000).toISOString())
        .then(({ data }) => data?.length || 0),

      // Commandes d'aujourd'hui
      supabase
        .from('orders')
        .select('id')
        .gte('created_at', todayStart.toISOString())
        .then(({ data }) => data?.length || 0),

      // Revenus d'aujourd'hui (depuis les commandes complétées)
      supabase
        .from('orders')
        .select('total_usd, total_cdf, currency')
        .eq('status', 'completed')
        .gte('created_at', todayStart.toISOString())
        .then(({ data }) => 
          data?.reduce((sum, order) => {
            if (order.total_usd) {
              return sum + parseFloat(order.total_usd)
            } else if (order.total_cdf) {
              return sum + (parseFloat(order.total_cdf) / 1667)
            }
            return sum
          }, 0) || 0
        ),

      // Transactions récentes pour calculer l'activité
      supabase
        .from('payment_transactions')
        .select('id, status, created_at')
        .gte('created_at', new Date(now.getTime() - 60 * 60 * 1000).toISOString())
        .then(({ data }) => data || [])
    ])

    // Calcul du taux d'erreur approximatif
    const failedTransactions = recentTransactions.filter(t => t.status === 'failed').length
    const totalTransactions = Math.max(recentTransactions.length, 1)
    const errorRate = (failedTransactions / totalTransactions) * 100

    // Calcul des tendances (comparaison avec l'heure précédente)
    const currentHourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours())
    const previousHourStart = new Date(currentHourStart.getTime() - 60 * 60 * 1000)

    const [
      previousHourOrders,
      previousHourRevenue,
      currentHourOrders,
      currentHourRevenue
    ] = await Promise.all([
      // Commandes heure précédente
      supabase
        .from('orders')
        .select('id')
        .gte('created_at', previousHourStart.toISOString())
        .lt('created_at', currentHourStart.toISOString())
        .then(({ data }) => data?.length || 0),

      // Revenus heure précédente
      supabase
        .from('orders')
        .select('total_usd, total_cdf, currency')
        .eq('status', 'completed')
        .gte('created_at', previousHourStart.toISOString())
        .lt('created_at', currentHourStart.toISOString())
        .then(({ data }) => 
          data?.reduce((sum, order) => {
            if (order.total_usd) {
              return sum + parseFloat(order.total_usd)
            } else if (order.total_cdf) {
              return sum + (parseFloat(order.total_cdf) / 1667)
            }
            return sum
          }, 0) || 0
        ),

      // Commandes heure actuelle
      supabase
        .from('orders')
        .select('id')
        .gte('created_at', currentHourStart.toISOString())
        .then(({ data }) => data?.length || 0),

      // Revenus heure actuelle
      supabase
        .from('orders')
        .select('total_usd, total_cdf, currency')
        .eq('status', 'completed')
        .gte('created_at', currentHourStart.toISOString())
        .then(({ data }) => 
          data?.reduce((sum, order) => {
            if (order.total_usd) {
              return sum + parseFloat(order.total_usd)
            } else if (order.total_cdf) {
              return sum + (parseFloat(order.total_cdf) / 1667)
            }
            return sum
          }, 0) || 0
        )
    ])

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
      todayRevenue: parseFloat(todayRevenue.toFixed(2)),
      errorRate: parseFloat(errorRate.toFixed(2)),
      systemLoad: Math.min((recentTransactions.length / 10) * 100, 100), // Pourcentage basé sur l'activité
      trends: {
        orders: parseFloat(ordersTrend.toFixed(1)),
        revenue: parseFloat(revenueTrend.toFixed(1))
      },
      alerts: systemAlerts,
      services: externalServices,
      lastUpdated: now.toISOString(),
      
      // Métriques détaillées
      metrics: {
        totalErrors: failedTransactions,
        criticalErrors: failedTransactions,
        avgResponseTime: Math.round(Math.random() * 200 + 100), // Mock - intégrer avec monitoring réel
        uptime: 99.9, // Mock - intégrer avec monitoring réel
        
        // Répartition des transactions par statut
        transactionsByStatus: recentTransactions.reduce((acc, transaction) => {
          acc[transaction.status] = (acc[transaction.status] || 0) + 1
          return acc
        }, {}),
        
        // Performance simplifiée
        performance: {
          activeTransactions: recentTransactions.length,
          successRate: Math.round(((totalTransactions - failedTransactions) / totalTransactions) * 100),
          totalTransactions: totalTransactions
        }
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
