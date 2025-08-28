import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// GET - Récupérer tous les services
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: services, error } = await supabase
      .from('services')
      .select(`
        *,
        platforms (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      services: services || []
    })

  } catch (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des services' },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau service
export async function POST(request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      platform_id,
      name,
      description,
      category,
      price_usd,
      price_cdf,
      min_quantity,
      max_quantity,
      delivery_time,
      quality,
      is_active
    } = body

    // Validation des données requises
    if (!platform_id || !name || !category) {
      return NextResponse.json(
        { success: false, error: 'Plateforme, nom et catégorie sont requis' },
        { status: 400 }
      )
    }

    const { data: service, error } = await supabase
      .from('services')
      .insert([
        {
          platform_id,
          name,
          description,
          category,
          price_usd: parseFloat(price_usd) || 0,
          price_cdf: parseFloat(price_cdf) || 0,
          min_quantity: parseInt(min_quantity) || 1,
          max_quantity: parseInt(max_quantity) || 10000,
          delivery_time: delivery_time || '0-1 heures',
          quality: quality || 'HIGH',
          is_active: is_active !== false
        }
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      service
    })

  } catch (error) {
    console.error('Error creating service:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création du service' },
      { status: 500 }
    )
  }
}
