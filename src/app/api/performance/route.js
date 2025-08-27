// API pour les métriques de performance
import { NextResponse } from 'next/server'
import { createPerformanceAPI } from '@/lib/performance/performanceMiddleware'
import { withSecurity } from '@/lib/security/securityMiddleware'

const performanceAPI = createPerformanceAPI()

async function handlePerformanceMetrics(request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'metrics'

    switch (type) {
      case 'metrics':
        return NextResponse.json({
          success: true,
          data: performanceAPI.getMetrics()
        })

      case 'recommendations':
        return NextResponse.json({
          success: true,
          data: performanceAPI.getRecommendations()
        })

      case 'cache':
        return NextResponse.json({
          success: true,
          data: performanceAPI.getCacheStats()
        })

      case 'all':
        return NextResponse.json({
          success: true,
          data: {
            metrics: performanceAPI.getMetrics(),
            recommendations: performanceAPI.getRecommendations(),
            cache: performanceAPI.getCacheStats()
          }
        })

      default:
        return NextResponse.json(
          { error: 'Type de métriques non supporté' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Erreur API performance:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des métriques' },
      { status: 500 }
    )
  }
}

async function handlePerformanceReset(request) {
  try {
    performanceAPI.reset()
    
    return NextResponse.json({
      success: true,
      message: 'Métriques de performance réinitialisées'
    })
  } catch (error) {
    console.error('Erreur reset performance:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la réinitialisation' },
      { status: 500 }
    )
  }
}

// Routes avec protection admin
export const GET = withSecurity(handlePerformanceMetrics, '/api/performance')
export const DELETE = withSecurity(handlePerformanceReset, '/api/performance')
