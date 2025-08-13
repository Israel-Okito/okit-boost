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
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let query = supabase
      .from('orders')
      .select(`
        *,
        profiles (full_name, email),
        order_items (
          *,
          services (name, platform_id)
        )
      `, { count: 'exact' })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: orders, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return NextResponse.json({
      orders: orders || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit)
    })

  } catch (error) {
    console.error('Admin orders fetch error:', error)
    const status = error.message === 'Non authentifié' ? 401 : 
                   error.message === 'Accès refusé' ? 403 : 500
    
    return NextResponse.json({ error: error.message }, { status })
  }
}


export async function PATCH(request) {
  try {
    const supabase = await createClient()
    await requireAdmin(supabase)

    const { orderId, status, adminNotes } = await request.json()

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'ID de commande et statut requis' },
        { status: 400 }
      )
    }

    const validStatuses = ['pending', 'processing', 'completed', 'cancelled', 'refunded']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Statut invalide' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('orders')
      .update({
        status,
        admin_notes: adminNotes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Order update error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    )
  }
}
