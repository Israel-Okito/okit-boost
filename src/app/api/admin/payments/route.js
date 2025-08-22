// src/app/api/admin/payments/route.js
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
    const method = searchParams.get('method')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    let query = supabase
      .from('payment_transactions')
      .select(`
        *,
        orders (
          id,
          order_number,
          customer_name,
          customer_email,
          total_cdf,
          total_usd
        ),
        profiles (
          full_name,
          email
        )
      `, { count: 'exact' })

    // Appliquer les filtres
    if (status) {
      query = query.eq('status', status)
    }

    if (method) {
      query = query.ilike('payment_method', `%${method}%`)
    }

    if (dateFrom) {
      query = query.gte('created_at', `${dateFrom}T00:00:00`)
    }

    if (dateTo) {
      query = query.lte('created_at', `${dateTo}T23:59:59`)
    }

    if (search) {
      query = query.or(`
        transaction_id.ilike.%${search}%,
        orders.customer_email.ilike.%${search}%,
        orders.customer_name.ilike.%${search}%,
        orders.order_number.ilike.%${search}%
      `)
    }

    const { data: payments, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return NextResponse.json({
      payments: payments || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit)
    })

  } catch (error) {
    console.error('Admin payments fetch error:', error)
    const status = error.message === 'Non authentifié' ? 401 : 
                   error.message === 'Accès refusé' ? 403 : 500
    
    return NextResponse.json({ error: error.message }, { status })
  }
}