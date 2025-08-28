import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// GET - Récupérer toutes les commandes
export async function GET(request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          service_name,
          platform_id,
          quantity,
          price_usd,
          price_cdf,
          total_usd,
          total_cdf,
          target_link
        ),
        profiles (
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    // Filtrer par statut si spécifié
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: orders, error } = await query

    if (error) throw error

    // Transformer les données pour inclure les informations du profil dans la commande
    const transformedOrders = orders?.map(order => ({
      ...order,
      customer_name: order.customer_name || order.profiles?.full_name || 'N/A',
      customer_email: order.customer_email || order.profiles?.email || 'N/A',
      items: order.order_items || []
    })) || []

    return NextResponse.json({
      success: true,
      orders: transformedOrders
    })

  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des commandes' },
      { status: 500 }
    )
  }
}