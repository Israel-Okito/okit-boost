import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Vérifier les droits admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Récupérer les statistiques
    const [
      { count: totalOrders },
      { count: pendingOrders },
      { count: processingOrders },
      { count: completedOrders },
      { count: totalUsers },
      { count: trialRequests }
    ] = await Promise.all([
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'processing'),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'user'),
      supabase.from('trial_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending')
    ])
    console.log(trialRequests)

    // Revenus
    const { data: revenueData } = await supabase
      .from('orders')
      .select('total_cdf, total_usd, currency')
      .eq('status', 'completed')

    const totalRevenueCDF = revenueData?.reduce((sum, order) => 
      sum + (order.currency === 'CDF' ? order.total_cdf : 0), 0) || 0
    const totalRevenueUSD = revenueData?.reduce((sum, order) => 
      sum + (order.currency === 'USD' ? order.total_usd : 0), 0) || 0

    // Commandes récentes
    const { data: recentOrders } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        total_cdf,
        total_usd,
        currency,
        created_at,
        profiles (full_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      totalOrders: totalOrders || 0,
      pendingOrders: pendingOrders || 0,
      processingOrders: processingOrders || 0,
      completedOrders: completedOrders || 0,
      totalUsers: totalUsers || 0,
      trialRequests: trialRequests || 0,
      totalRevenueCDF,
      totalRevenueUSD,
      recentOrders: recentOrders || []
    })

  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    )
  }
}
