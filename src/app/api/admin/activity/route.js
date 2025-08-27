/**
 * API pour récupérer l'activité récente de la plateforme
 */

import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"
import { errorHandler } from "@/lib/errors/errorHandler"
import { logger } from "@/lib/errors/logger"

export async function GET(request) {
  const requestId = errorHandler.generateErrorId()
  
  return await errorHandler.safeExecute(async () => {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
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

    const limit = parseInt(searchParams.get('limit')) || 50
    const type = searchParams.get('type') // 'order', 'payment', 'user', 'error'
    const timeRange = searchParams.get('timeRange') || '24h'

    await logger.info('Recent activity requested', {
      requestId,
      userId: user.id,
      limit,
      type,
      timeRange
    })

    // Calcul de la date de début selon le range
    const now = new Date()
    let startDate = new Date()
    
    switch (timeRange) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000)
        break
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    }

    const activities = []

    try {
      // Récupérer les différents types d'activités en parallèle
      const [
        recentOrders,
        recentPayments,
        recentUsers,
        recentErrors,
        recentTrials
      ] = await Promise.all([
        // Commandes récentes
        (!type || type === 'order') ? supabase
          .from('orders')
          .select(`
            id,
            order_number,
            status,
            created_at,
            user_id,
            customer_name,
            total_usd,
            total_cdf,
            currency
          `)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false })
          .limit(Math.floor(limit / 4))
          .then(({ data }) => data || []) : [],

        // Paiements récents
        (!type || type === 'payment') ? supabase
          .from('payment_transactions')
          .select(`
            id,
            transaction_id,
            status,
            amount,
            currency,
            payment_method,
            created_at,
            user_id,
            customer_email
          `)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false })
          .limit(Math.floor(limit / 4))
          .then(({ data }) => data || []) : [],

        // Nouveaux utilisateurs
        (!type || type === 'user') ? supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            email,
            created_at,
            role
          `)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false })
          .limit(Math.floor(limit / 4))
          .then(({ data }) => data || []) : [],

        // Erreurs récentes
        (!type || type === 'error') ? supabase
          .from('error_logs')
          .select(`
            id,
            type,
            severity,
            message,
            created_at,
            user_id
          `)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false })
          .limit(Math.floor(limit / 4))
          .then(({ data }) => data || []) : [],

        // Demandes d'essai récentes
        (!type || type === 'trial') ? supabase
          .from('trial_requests')
          .select(`
            id,
            status,
            service_name,
            created_at,
            user_id,
            customer_name
          `)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false })
          .limit(Math.floor(limit / 4))
          .then(({ data }) => data || []) : []
      ])

      // Transformer les commandes en activités
      recentOrders.forEach(order => {
        activities.push({
          id: `order_${order.id}`,
          type: 'order',
          description: `Nouvelle commande #${order.order_number} de ${order.customer_name}`,
          details: {
            orderId: order.id,
            orderNumber: order.order_number,
            status: order.status,
            amount: order.currency === 'USD' ? order.total_usd : order.total_cdf,
            currency: order.currency,
            customerName: order.customer_name
          },
          severity: order.status === 'failed' ? 'high' : 'low',
          timestamp: order.created_at,
          userId: order.user_id,
          icon: 'ShoppingCart',
          color: order.status === 'completed' ? 'green' : 
                order.status === 'failed' ? 'red' : 'blue'
        })
      })

      // Transformer les paiements en activités
      recentPayments.forEach(payment => {
        const isSuccess = payment.status === 'ACCEPTED'
        const isFailed = payment.status === 'REFUSED' || payment.status === 'CANCELLED'
        
        activities.push({
          id: `payment_${payment.id}`,
          type: 'payment',
          description: `Paiement ${isSuccess ? 'réussi' : isFailed ? 'échoué' : 'en cours'} - ${payment.amount} ${payment.currency}`,
          details: {
            transactionId: payment.transaction_id,
            status: payment.status,
            amount: payment.amount,
            currency: payment.currency,
            method: payment.payment_method,
            customerEmail: payment.customer_email
          },
          severity: isFailed ? 'medium' : 'low',
          timestamp: payment.created_at,
          userId: payment.user_id,
          icon: 'DollarSign',
          color: isSuccess ? 'green' : isFailed ? 'red' : 'yellow'
        })
      })

      // Transformer les utilisateurs en activités
      recentUsers.forEach(user => {
        activities.push({
          id: `user_${user.id}`,
          type: 'user',
          description: `Nouvel utilisateur inscrit: ${user.full_name || user.email}`,
          details: {
            userId: user.id,
            name: user.full_name,
            email: user.email,
            role: user.role
          },
          severity: 'low',
          timestamp: user.created_at,
          userId: user.id,
          icon: 'Users',
          color: 'purple'
        })
      })

      // Transformer les erreurs en activités
      recentErrors.forEach(error => {
        activities.push({
          id: `error_${error.id}`,
          type: 'error',
          description: `Erreur ${error.type}: ${error.message.substring(0, 50)}...`,
          details: {
            errorId: error.id,
            type: error.type,
            severity: error.severity,
            message: error.message
          },
          severity: error.severity === 'critical' ? 'high' : 
                   error.severity === 'high' ? 'medium' : 'low',
          timestamp: error.created_at,
          userId: error.user_id,
          icon: 'AlertTriangle',
          color: 'red'
        })
      })

      // Transformer les demandes d'essai en activités
      recentTrials.forEach(trial => {
        activities.push({
          id: `trial_${trial.id}`,
          type: 'trial',
          description: `Demande d'essai ${trial.status}: ${trial.service_name} par ${trial.customer_name}`,
          details: {
            trialId: trial.id,
            status: trial.status,
            serviceName: trial.service_name,
            customerName: trial.customer_name
          },
          severity: trial.status === 'rejected' ? 'medium' : 'low',
          timestamp: trial.created_at,
          userId: trial.user_id,
          icon: 'Zap',
          color: trial.status === 'approved' ? 'green' : 
                trial.status === 'rejected' ? 'red' : 'yellow'
        })
      })

      // Trier toutes les activités par timestamp décroissant
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

      // Limiter au nombre demandé
      const limitedActivities = activities.slice(0, limit)

      // Statistiques sur les activités
      const stats = {
        total: activities.length,
        byType: activities.reduce((acc, activity) => {
          acc[activity.type] = (acc[activity.type] || 0) + 1
          return acc
        }, {}),
        bySeverity: activities.reduce((acc, activity) => {
          acc[activity.severity] = (acc[activity.severity] || 0) + 1
          return acc
        }, {}),
        lastActivity: activities.length > 0 ? activities[0].timestamp : null
      }

      return NextResponse.json({
        success: true,
        activities: limitedActivities,
        stats,
        filters: {
          limit,
          type,
          timeRange,
          startDate: startDate.toISOString()
        },
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      await logger.error('Failed to fetch recent activity', {
        requestId,
        error: error.message,
        stack: error.stack
      })

      return NextResponse.json(
        { error: 'Erreur lors de la récupération de l\'activité' },
        { status: 500 }
      )
    }

  }, {
    requestId,
    endpoint: '/api/admin/activity',
    method: 'GET',
    metadata: { operation: 'recent_activity' }
  })
}
