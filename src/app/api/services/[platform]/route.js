import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request, { params }) {
  try {
    const supabase = await createClient()
    const { platform } = params

    // Vérifier que la plateforme existe
    const { data: platformData, error: platformError } = await supabase
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
      .select('*')
      .eq('platform_id', platform)
      .eq('is_active', true)
      .order('name')

    if (servicesError) throw servicesError

    return NextResponse.json({
      platform: platformData,
      services: services || []
    })

  } catch (error) {
    console.error('Services fetch error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des services' },
      { status: 500 }
    )
  }
}