// Système de lazy loading et optimisation des composants
import { Suspense, lazy, memo, useMemo, useCallback, useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import Image from 'next/image'

/**
 * HOC pour le lazy loading de composants
 */
export function withLazyLoading(importFunc, fallback = null) {
  const LazyComponent = lazy(importFunc)
  
  return function WrappedComponent(props) {
    const defaultFallback = fallback || (
      <div className="p-4">
        <Skeleton className="h-32 w-full" />
      </div>
    )

    return (
      <Suspense fallback={defaultFallback}>
        <LazyComponent {...props} />
      </Suspense>
    )
  }
}

/**
 * Hook pour le lazy loading de données avec pagination
 */
export function useLazyData(fetchFunction, options = {}) {
  const {
    initialPage = 1,
    pageSize = 20,
    dependencies = [],
    enabled = true,
    prefetchNext = true
  } = options

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [error, setError] = useState(null)

  // Cache pour les pages déjà chargées
  const [cache, setCache] = useState(new Map())

  const loadPage = useCallback(async (page, append = false) => {
    if (!enabled) return

    // Vérifier le cache
    if (cache.has(page)) {
      const cachedData = cache.get(page)
      if (append) {
        setData(prev => [...prev, ...cachedData])
      } else {
        setData(cachedData)
      }
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await fetchFunction({
        page,
        limit: pageSize,
        offset: (page - 1) * pageSize
      })

      const newData = result.data || result
      
      // Mettre en cache
      setCache(prev => new Map(prev).set(page, newData))

      if (append) {
        setData(prev => [...prev, ...newData])
      } else {
        setData(newData)
      }

      // Vérifier s'il y a plus de données
      setHasMore(newData.length === pageSize)

      // Précharger la page suivante si demandé
      if (prefetchNext && newData.length === pageSize) {
        setTimeout(() => {
          prefetchPage(page + 1)
        }, 1000)
      }

    } catch (err) {
      setError(err)
      console.error('Erreur lazy loading:', err)
    } finally {
      setLoading(false)
    }
  }, [fetchFunction, pageSize, enabled, cache, prefetchNext])

  const prefetchPage = useCallback(async (page) => {
    if (cache.has(page)) return

    try {
      const result = await fetchFunction({
        page,
        limit: pageSize,
        offset: (page - 1) * pageSize
      })

      const newData = result.data || result
      setCache(prev => new Map(prev).set(page, newData))
    } catch (error) {
      console.warn('Erreur prefetch page:', error)
    }
  }, [fetchFunction, pageSize, cache])

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return
    const nextPage = currentPage + 1
    setCurrentPage(nextPage)
    loadPage(nextPage, true)
  }, [loading, hasMore, currentPage, loadPage])

  const refresh = useCallback(() => {
    setCache(new Map())
    setCurrentPage(initialPage)
    setData([])
    setHasMore(true)
    loadPage(initialPage, false)
  }, [initialPage, loadPage])

  // Charger la première page
  useEffect(() => {
    if (enabled) {
      loadPage(initialPage, false)
    }
  }, [...dependencies, enabled])

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    currentPage
  }
}

/**
 * Hook pour le lazy loading avec intersection observer
 */
export function useInfiniteScroll(fetchMore, options = {}) {
  const {
    threshold = 0.1,
    rootMargin = '100px',
    enabled = true
  } = options

  const [targetRef, setTargetRef] = useState(null)
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    if (!targetRef || !enabled) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
        if (entry.isIntersecting) {
          fetchMore()
        }
      },
      {
        threshold,
        rootMargin
      }
    )

    observer.observe(targetRef)

    return () => {
      observer.unobserve(targetRef)
    }
  }, [targetRef, enabled, fetchMore, threshold, rootMargin])

  return {
    targetRef: setTargetRef,
    isIntersecting
  }
}

/**
 * Composant pour le lazy loading d'images
 */
export const LazyImage = memo(function LazyImage({
  src,
  alt,
  className,
  placeholder,
  ...props
}) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [inView, setInView] = useState(false)

  const imgRef = useCallback((node) => {
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.unobserve(node)
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(node)
  }, [])

  const handleLoad = useCallback(() => {
    setLoaded(true)
  }, [])

  const handleError = useCallback(() => {
    setError(true)
  }, [])

  return (
    <div ref={imgRef} className={`relative ${className}`}>
      {inView && (
        <>
          <Image
            src={src}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
            className={`transition-opacity duration-300 ${
              loaded ? 'opacity-100' : 'opacity-0'
            } ${className}`}
            {...props}
          />
          {!loaded && !error && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse">
              {placeholder || <Skeleton className="w-full h-full" />}
            </div>
          )}
          {error && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
              <span className="text-gray-400 text-sm">Image non disponible</span>
            </div>
          )}
        </>
      )}
      {!inView && (
        <div className="bg-gray-200 animate-pulse w-full h-full">
          {placeholder || <Skeleton className="w-full h-full" />}
        </div>
      )}
    </div>
  )
})

/**
 * HOC pour l'optimisation des listes avec virtualisation
 */
export function withVirtualization(Component) {
  return memo(function VirtualizedComponent({
    items,
    itemHeight = 100,
    containerHeight = 400,
    overscan = 5,
    ...props
  }) {
    const [scrollTop, setScrollTop] = useState(0)

    const visibleStart = Math.floor(scrollTop / itemHeight)
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length
    )

    const visibleItems = items.slice(
      Math.max(0, visibleStart - overscan),
      visibleEnd
    )

    const offsetY = Math.max(0, visibleStart - overscan) * itemHeight

    const handleScroll = useCallback((e) => {
      setScrollTop(e.target.scrollTop)
    }, [])

    return (
      <div
        style={{ height: containerHeight, overflow: 'auto' }}
        onScroll={handleScroll}
      >
        <div style={{ height: items.length * itemHeight, position: 'relative' }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            {visibleItems.map((item, index) => (
              <Component
                key={item.id || index}
                item={item}
                style={{ height: itemHeight }}
                {...props}
              />
            ))}
          </div>
        </div>
      </div>
    )
  })
}

/**
 * Hook pour optimiser les re-renders avec stable references
 */
export function useStableCallback(callback, deps) {
  return useCallback(callback, deps)
}

export function useStableMemo(factory, deps) {
  return useMemo(factory, deps)
}

/**
 * HOC pour le debouncing des updates
 */
export function withDebounce(Component, delay = 300) {
  return memo(function DebouncedComponent(props) {
    const [debouncedProps, setDebouncedProps] = useState(props)

    useEffect(() => {
      const timer = setTimeout(() => {
        setDebouncedProps(props)
      }, delay)

      return () => clearTimeout(timer)
    }, [props, delay])

    return <Component {...debouncedProps} />
  })
}

/**
 * Composant pour le lazy loading de contenu avec Suspense
 */
export function LazySection({ children, fallback, minHeight = 200 }) {
  const [ref, setRef] = useState(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!ref) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(ref)
        }
      },
      { rootMargin: '50px' }
    )

    observer.observe(ref)

    return () => observer.unobserve(ref)
  }, [ref])

  const defaultFallback = (
    <div style={{ minHeight }} className="animate-pulse bg-gray-100 rounded-lg" />
  )

  return (
    <div ref={setRef} style={{ minHeight }}>
      {isVisible ? (
        <Suspense fallback={fallback || defaultFallback}>
          {children}
        </Suspense>
      ) : (
        fallback || defaultFallback
      )}
    </div>
  )
}

/**
 * Hook pour le préchargement de routes
 */
export function useRoutePreload() {
  const preloadRoute = useCallback((href) => {
    if (typeof window !== 'undefined') {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = href
      document.head.appendChild(link)
    }
  }, [])

  const preloadRouteOnHover = useCallback((href) => {
    return {
      onMouseEnter: () => preloadRoute(href),
      onFocus: () => preloadRoute(href)
    }
  }, [preloadRoute])

  return {
    preloadRoute,
    preloadRouteOnHover
  }
}

/**
 * Composants lazy chargés
 */
export const LazyComponents = {
  // Admin Dashboard
  AdminDashboard: withLazyLoading(
    () => import('@/components/admin/Dashboard'),
    <div className="p-8"><Skeleton className="h-96 w-full" /></div>
  ),

  // Payments Manager
  PaymentsManager: withLazyLoading(
    () => import('@/components/admin/PaymentsManager'),
    <div className="p-4"><Skeleton className="h-64 w-full" /></div>
  ),

  // CinetPay Payment
  CinetPayPayment: withLazyLoading(
    () => import('@/components/payments/cinetPayPayment'),
    <div className="space-y-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  ),

  // Charts - Commenté car le composant n'existe pas encore
  // StatsChart: withLazyLoading(
  //   () => import('@/components/charts/StatsChart'),
  //   <Skeleton className="h-64 w-full" />
  // )
}

/**
 * Performance monitoring pour les composants
 */
export function withPerformanceMonitoring(Component, componentName) {
  return memo(function MonitoredComponent(props) {
    useEffect(() => {
      const startTime = performance.now()
      
      return () => {
        const endTime = performance.now()
        const renderTime = endTime - startTime
        
        if (renderTime > 16) { // Plus de 16ms = potentiellement lent
          console.warn(`⚠️ Composant lent détecté: ${componentName} - ${renderTime.toFixed(2)}ms`)
        }
      }
    })

    return <Component {...props} />
  })
}
