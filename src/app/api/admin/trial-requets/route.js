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
        .from('trial_requests')
        .select(`
            id,
           name,
           email,
           phone,
           platform,
           service,
           status,
           target_link,
           notes,
           created_at

        `, {count:"exact"})
  
        if (status) {
            query = query.eq('status', status)
          }
 
      const { data: trials, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
  
      if (error) throw error
  
      return NextResponse.json({
        trials: trials || [],
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit)
      })
  
    } catch (error) {
      console.error('Admin trial requets fetch error:', error)
      const status = error.message === 'Non authentifié' ? 401 : 
                     error.message === 'Accès refusé' ? 403 : 500
      
      return NextResponse.json({ error: error.message }, { status })
    }
  }
  


  
export async function PATCH(request) {
    try {
      const supabase = await createClient()
      await requireAdmin(supabase)
  
      const { requestId, status, adminNotes } = await request.json()
  
      if (!requestId || !status) {
        return NextResponse.json(
          { error: 'ID de commande et statut requis' },
          { status: 400 }
        )
      }

      const validStatuses = ['pending', 'approved', 'rejected', 'completed']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Statut invalide' },
          { status: 400 }
        )
      }
  
      const { error } = await supabase
        .from('trial_requests')
        .update({
          status,
          admin_notes: adminNotes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
  
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
  