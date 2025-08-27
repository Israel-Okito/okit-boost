import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { withPerformanceOptimization } from '@/lib/performance/performanceMiddleware'
import { cachedPlatforms } from '@/lib/performance/cache'

async function handleGetPlatforms() {
  try {
    const supabase = await createClient()

    // Utiliser le cache optimisé pour les plateformes avec stats
    const platformsWithStats = await cachedPlatforms.getWithStats(supabase)

    return NextResponse.json({
      success: true,
      platforms: platformsWithStats || [],
      cached: true,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('API Platforms error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de la récupération des plateformes',
        code: 'PLATFORMS_FETCH_ERROR'
      },
      { status: 500 }
    )
  }
}

// Exporter avec optimisation des performances
export const GET = withPerformanceOptimization(handleGetPlatforms, {
  enableCache: true,
  cacheTTL: 600000, // 10 minutes
  enableMetrics: true
})