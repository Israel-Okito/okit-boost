// src/app/api/admin/payments/stats/route.js
import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

async function requireAdmin(supabase) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Non authentifié')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    throw new Error('Accès refusé')
  }

  return user
}

export async function GET(request) {
  try {
    const supabase = await createClient()
    await requireAdmin(supabase)

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // jours
    
    // Date de début pour la période
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    // Statistiques générales
    const [
      { count: totalTransactions },
      { count: successfulTransactions },
      { count: pendingTransactions },
      { count: failedTransactions },
      { count: newTransactionsToday }
    ] = await Promise.all([
      supabase
        .from('payment_transactions')
        .select('*', { count: 'exact', head: true }),
      
      supabase
        .from('payment_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ACCEPTED'),
      
      supabase
        .from('payment_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDING'),
      
      supabase
        .from('payment_transactions')
        .select('*', { count: 'exact', head: true })
        .in('status', ['REFUSED', 'CANCELLED']),
      
      supabase
        .from('payment_transactions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date().toISOString().split('T')[0])
    ])

    // Revenus par devise
    const { data: revenueData } = await supabase
      .from('payment_transactions')
      .select('amount, currency')
      .eq('status', 'ACCEPTED')

    const totalRevenueCDF = revenueData?.reduce((sum, t) => 
      sum + (t.currency === 'CDF' ? parseFloat(t.amount) : 0), 0) || 0
    
    const totalRevenueUSD = revenueData?.reduce((sum, t) => 
      sum + (t.currency === 'USD' ? parseFloat(t.amount) : 0), 0) || 0

    // Taux de succès
    const successRate = totalTransactions > 0 
      ? Math.round((successfulTransactions / totalTransactions) * 100)
      : 0

    // Revenus par mois (pour calculer la croissance)
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

    const { data: currentMonthRevenue } = await supabase
      .from('payment_transactions')
      .select('amount, currency')
      .eq('status', 'ACCEPTED')
      .gte('created_at', new Date(currentYear, currentMonth, 1).toISOString())
      .lt('created_at', new Date(currentYear, currentMonth + 1, 1).toISOString())

    const { data: lastMonthRevenue } = await supabase
      .from('payment_transactions')
      .select('amount, currency')
      .eq('status', 'ACCEPTED')
      .gte('created_at', new Date(lastMonthYear, lastMonth, 1).toISOString())
      .lt('created_at', new Date(lastMonthYear, lastMonth + 1, 1).toISOString())

    const currentRevenueCDF = currentMonthRevenue?.reduce((sum, t) => 
      sum + (t.currency === 'CDF' ? parseFloat(t.amount) : 0), 0) || 0
    
    const lastRevenueCDF = lastMonthRevenue?.reduce((sum, t) => 
      sum + (t.currency === 'CDF' ? parseFloat(t.amount) : 0), 0) || 0

    const currentRevenueUSD = currentMonthRevenue?.reduce((sum, t) => 
      sum + (t.currency === 'USD' ? parseFloat(t.amount) : 0), 0) || 0
    
    const lastRevenueUSD = lastMonthRevenue?.reduce((sum, t) => 
      sum + (t.currency === 'USD' ? parseFloat(t.amount) : 0), 0) || 0

    const revenueGrowthCDF = lastRevenueCDF > 0 
      ? Math.round(((currentRevenueCDF - lastRevenueCDF) / lastRevenueCDF) * 100)
      : 0

    const revenueGrowthUSD = lastRevenueUSD > 0 
      ? Math.round(((currentRevenueUSD - lastRevenueUSD) / lastRevenueUSD) * 100)
      : 0

    // Statistiques par méthode de paiement
    const { data: methodStats } = await supabase
      .from('payment_transactions')
      .select('payment_method, status')
      .gte('created_at', startDate.toISOString())

    const paymentMethodBreakdown = {}
    methodStats?.forEach(transaction => {
      const method = transaction.payment_method || 'unknown'
      if (!paymentMethodBreakdown[method]) {
        paymentMethodBreakdown[method] = {
          total: 0,
          successful: 0,
          failed: 0,
          pending: 0
        }
      }
      
      paymentMethodBreakdown[method].total++
      
      switch (transaction.status) {