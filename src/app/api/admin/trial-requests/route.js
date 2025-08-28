import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// GET - Récupérer toutes les demandes d'essai
export async function GET(request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('trial_requests')
      .select('*')
      .order('created_at', { ascending: false })

    // Filtrer par statut si spécifié
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: trials, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      trials: trials || []
    })

  } catch (error) {
    console.error('Error fetching trial requests:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des demandes d\'essai' },
      { status: 500 }
    )
  }
}
