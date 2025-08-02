import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Récupérer les plateformes avec le nombre de services
    const { data: platforms, error } = await supabase
      .from('platforms')
      .select(`
        *,
        services!inner(count)
      `)
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('Platforms fetch error:', error)
      throw error
    }

    // Récupérer le prix minimum pour chaque plateforme
    const platformsWithStats = await Promise.all(
      platforms.map(async (platform) => {
        // Compter les services
        const { count: servicesCount } = await supabase
          .from('services')
          .select('*', { count: 'exact', head: true })
          .eq('platform_id', platform.id)
          .eq('is_active', true)

        // Récupérer le prix minimum
        const { data: minPriceService } = await supabase
          .from('services')
          .select('price_cdf')
          .eq('platform_id', platform.id)
          .eq('is_active', true)
          .order('price_cdf', { ascending: true })
          .limit(1)
          .single()

        return {
          ...platform,
          services_count: servicesCount || 0,
          min_price: minPriceService?.price_cdf || null
        }
      })
    )

    return NextResponse.json({
      platforms: platformsWithStats || []
    })

  } catch (error) {
    console.error('API Platforms error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des plateformes' },
      { status: 500 }
    )
  }
}