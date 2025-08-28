import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { withPerformanceOptimization } from '@/lib/performance/performanceMiddleware'
import { cachedServices, cachedPlatforms } from '@/lib/performance/cache'

async function handleGetServices() {
  const startTime = Date.now()
  
  try {
    const supabase = await createClient()

    // Récupérer toutes les plateformes et tous les services en parallèle
    const [platformsResult, servicesResult] = await Promise.all([
      cachedPlatforms.getAll(supabase),
      supabase
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
        .eq('is_active', true)
        .order('platform_id')
        .order('name')
    ])

    if (servicesResult.error) {
      throw servicesResult.error
    }

    // Organiser les services par plateforme
    const servicesByPlatform = {}
    const platforms = platformsResult || []
    
    // Initialiser chaque plateforme
    platforms.forEach(platform => {
      servicesByPlatform[platform.id] = {
        platform,
        services: []
      }
    })

    // Regrouper les services par plateforme
    const servicesData = servicesResult.data || []
    servicesData.forEach(service => {
      if (servicesByPlatform[service.platform_id]) {
        servicesByPlatform[service.platform_id].services.push(service)
      }
    })

    const responseTime = Date.now() - startTime
    // console.log(`⚡ Services API optimisée: ${responseTime}ms (${servicesData.length} services)`)

    return NextResponse.json({
      success: true,
      platforms,
      servicesByPlatform,
      totalServices: servicesData.length,
      responseTime,
      cached: true,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('API Services error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de la récupération des services',
        code: 'SERVICES_FETCH_ERROR'
      },
      { status: 500 }
    )
  }
}

// Exporter avec optimisation des performances
export const GET = withPerformanceOptimization(handleGetServices, {
  enableCache: true,
  cacheTTL: 300000, // 5 minutes
  enableMetrics: true,
  maxAge: 300 // Cache navigateur 5 minutes
})