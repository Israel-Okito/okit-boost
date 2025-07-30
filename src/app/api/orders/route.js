// src/app/api/orders/route.js
import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const orderData = await request.json()

    // Validation des données
    if (!orderData.items || orderData.items.length === 0) {
      return NextResponse.json(
        { error: 'Aucun article dans la commande' },
        { status: 400 }
      )
    }

    // Vérifier que tous les services existent
    const serviceIds = orderData.items.map(item => item.service_id)
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .in('id', serviceIds)

    if (servicesError) throw servicesError

    if (services.length !== serviceIds.length) {
      return NextResponse.json(
        { error: 'Un ou plusieurs services sont invalides' },
        { status: 400 }
      )
    }

    // Recalculer les totaux pour la sécurité
    let totalUSD = 0
    let totalCDF = 0

    const validatedItems = orderData.items.map(item => {
      const service = services.find(s => s.id === item.service_id)
      if (!service) {
        throw new Error(`Service ${item.service_id} non trouvé`)
      }

      const itemTotalUSD = service.price_usd * item.quantity
      const itemTotalCDF = service.price_cdf * item.quantity

      totalUSD += itemTotalUSD
      totalCDF += itemTotalCDF

      return {
        ...item,
        price_usd: service.price_usd,
        price_cdf: service.price_cdf,
        total_usd: itemTotalUSD,
        total_cdf: itemTotalCDF
      }
    })

    // Créer la commande
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        total_usd: totalUSD,
        total_cdf: totalCDF,
        currency: orderData.currency,
        customer_name: orderData.customer_name,
        customer_email: orderData.customer_email,
        customer_phone: orderData.customer_phone,
        payment_method: orderData.payment_method,
        notes: orderData.notes
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Créer les éléments de commande
    const orderItems = validatedItems.map(item => ({
      order_id: order.id,
      service_id: item.service_id,
      service_name: item.service_name,
      platform_name: item.platform,
      target_link: item.target_link,
      quantity: item.quantity,
      unit_price_usd: item.price_usd,
      unit_price_cdf: item.price_cdf,
      total_usd: item.total_usd,
      total_cdf: item.total_cdf
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    return NextResponse.json({
      success: true,
      order_id: order.id,
      order_number: order.order_number
    })

  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la commande' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          services (name, platform_id)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ orders: orders || [] })
  } catch (error) {
    console.error('Orders fetch error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des commandes' },
      { status: 500 }
    )
  }
}