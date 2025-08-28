import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// GET - Récupérer toutes les plateformes
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: platforms, error } = await supabase
      .from('platforms')
      .select(`
        *,
        services_count:services(count)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Transformer le count en nombre
    const platformsWithCount = platforms?.map(platform => ({
      ...platform,
      services_count: platform.services_count?.[0]?.count || 0
    })) || []

    return NextResponse.json({
      success: true,
      platforms: platformsWithCount
    })

  } catch (error) {
    console.error('Error fetching platforms:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des plateformes' },
      { status: 500 }
    )
  }
}

// POST - Créer une nouvelle plateforme
export async function POST(request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      id,
      name,
      description,
      icon_url,
      color_from,
      color_to,
      is_active
    } = body

    // Validation des données requises
    if (!id || !name) {
      return NextResponse.json(
        { success: false, error: 'ID et nom sont requis' },
        { status: 400 }
      )
    }

    // Vérifier que l'ID n'existe pas déjà
    const { data: existing } = await supabase
      .from('platforms')
      .select('id')
      .eq('id', id)
      .single()

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Une plateforme avec cet ID existe déjà' },
        { status: 400 }
      )
    }

    const { data: platform, error } = await supabase
      .from('platforms')
      .insert([
        {
          id: id.toLowerCase().replace(/\s+/g, '-'),
          name,
          description,
          icon_url,
          color_from: color_from || '#3B82F6',
          color_to: color_to || '#1D4ED8',
          is_active: is_active !== false
        }
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      platform
    })

  } catch (error) {
    console.error('Error creating platform:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création de la plateforme' },
      { status: 500 }
    )
  }
}
