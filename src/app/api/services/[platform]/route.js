//api/services/[platform]/page.jsx

import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request,  context ) {
  try {
    const supabase = await createClient()
    
    // // Vérifier l'authentification
    // const {
    //   data: { session },
    //   error: sessionError,
    // } = await supabase.auth.getSession()

    // if (sessionError || !session) {
    //   return NextResponse.json(
    //     { error: 'Non authentifié' },
    //     { status: 401 }
    //   )
    // }

    

    const params = await context.params
    const platform  = params.platform



    // Vérifier que la plateforme existe
    const  { data: platformData, error: platformError } = await supabase
      .from('platforms')
      .select('*')
      .eq('id', platform)
      .eq('is_active', true)
      .single()

    if (platformError || !platformData) {
      return NextResponse.json(
        { error: 'Plateforme non trouvée' },
        { status: 404 }
      )
    }

    // Récupérer les services
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select(`
        id,
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
      `)
      .eq('platform_id', platform)
      .eq('is_active', true)
      .order('name')

    if (servicesError) {
      console.error('Services fetch error:', servicesError)
      throw servicesError
    }

    return NextResponse.json({
      platform: platformData,
      services: services || []
    })

  } catch (error) {
    console.error('API Services error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des services' },
      { status: 500 }
    )
  }
}