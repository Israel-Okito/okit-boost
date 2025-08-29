/**
 * API pour la gestion des transactions avec détails utilisateurs
 */

import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request) {
  try {
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

    // Paramètres de filtrage
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 50
    const status = searchParams.get('status') // pending, completed, failed
    const period = searchParams.get('period') || '30d'
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Calculer les dates selon la période
    const now = new Date()
    const periodDays = {
      '1d': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90,
      'all': null
    }
    const daysBack = periodDays[period]
    const startDate = daysBack ? new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000)) : null

    // Construire la requête de base
    let query = supabase
      .from('payment_transactions')
      .select(`
        id,
        transaction_id,
        amount,
        currency,
        status,
        payment_method,
        customer_name,
        customer_email,
        customer_phone,
        created_at,
        completed_at,
        updated_at,
        user_id,
        order_id,
        metadata,
        profiles!inner(
          id,
          full_name,
          email,
          created_at
        ),
        orders(
          id,
          order_number,
          status,
          total_usd,
          total_cdf
        )
      `)

    // Appliquer les filtres
    if (status) {
      query = query.eq('status', status)
    }

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString())
    }

    // Appliquer la pagination et le tri
    const offset = (page - 1) * limit
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1)

    const { data: transactions, error: transactionsError } = await query

    if (transactionsError) {
      console.error('Erreur transactions:', transactionsError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des transactions' },
        { status: 500 }
      )
    }

    // Compter le total pour la pagination
    let countQuery = supabase
      .from('payment_transactions')
      .select('id', { count: 'exact', head: true })

    if (status) {
      countQuery = countQuery.eq('status', status)
    }

    if (startDate) {
      countQuery = countQuery.gte('created_at', startDate.toISOString())
    }

    const { count: totalCount } = await countQuery

    // Calculer les statistiques des revenus basées sur les commandes
    let revenueStatsQuery = supabase
      .from('orders')
      .select('total_usd, total_cdf, currency, status, created_at')

    if (startDate) {
      revenueStatsQuery = revenueStatsQuery.gte('created_at', startDate.toISOString())
    }

    const { data: revenueData } = await revenueStatsQuery

    // Statistiques des transactions
    let transactionStatsQuery = supabase
      .from('payment_transactions')
      .select('status, created_at')

    if (startDate) {
      transactionStatsQuery = transactionStatsQuery.gte('created_at', startDate.toISOString())
    }

    const { data: transactionData } = await transactionStatsQuery

    // Calculer les statistiques
    const stats = {
      totalTransactions: totalCount || 0,
      totalRevenue: {
        usd: 0,
        cdf: 0
      },
      byStatus: {
        pending: 0,
        completed: 0,
        failed: 0,
        cancelled: 0
      },
      conversionRate: 0
    }

    // Calculer les revenus basés sur les commandes complétées
    if (revenueData) {
      revenueData.forEach(order => {
        if (order.status === 'completed') {
          if (order.total_usd) {
            stats.totalRevenue.usd += parseFloat(order.total_usd)
          }
          if (order.total_cdf) {
            stats.totalRevenue.cdf += parseFloat(order.total_cdf)
            // Ajouter la conversion CDF -> USD
            stats.totalRevenue.usd += parseFloat(order.total_cdf) / 1667
          }
        }
      })
    }

    // Calculer les statistiques de statut basées sur les transactions
    if (transactionData) {
      transactionData.forEach(transaction => {
        stats.byStatus[transaction.status] = (stats.byStatus[transaction.status] || 0) + 1
      })

      // Calculer le taux de conversion
      const totalAttempts = transactionData.length
      const successful = stats.byStatus.completed || 0
      stats.conversionRate = totalAttempts > 0 ? (successful / totalAttempts) * 100 : 0
    }

    // Formater les transactions pour l'affichage
    const formattedTransactions = transactions?.map(transaction => ({
      id: transaction.id,
      transactionId: transaction.transaction_id,
      amount: transaction.amount,
      amountUSD: transaction.currency === 'USD' 
        ? transaction.amount 
        : (transaction.amount || 0) / 1667,
      currency: transaction.currency,
      status: transaction.status,
      paymentMethod: transaction.payment_method,
      customer: {
        name: transaction.customer_name || transaction.profiles?.full_name || 'Client',
        email: transaction.customer_email || transaction.profiles?.email,
        phone: transaction.customer_phone
      },
      user: {
        id: transaction.user_id,
        name: transaction.profiles?.full_name,
        email: transaction.profiles?.email,
        joinedAt: transaction.profiles?.created_at
      },
      order: transaction.orders ? {
        id: transaction.orders.id,
        orderNumber: transaction.orders.order_number,
        status: transaction.orders.status,
        totalUSD: transaction.orders.total_usd,
        totalCDF: transaction.orders.total_cdf
      } : null,
      dates: {
        created: transaction.created_at,
        completed: transaction.completed_at,
        updated: transaction.updated_at
      },
      metadata: transaction.metadata ? JSON.parse(transaction.metadata) : null
    })) || []

    // Calculer les informations de pagination
    const totalPages = Math.ceil((totalCount || 0) / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    return NextResponse.json({
      success: true,
      transactions: formattedTransactions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext,
        hasPrev
      },
      stats,
      filters: {
        status,
        period,
        sortBy,
        sortOrder,
        startDate: startDate?.toISOString()
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erreur API transactions:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
