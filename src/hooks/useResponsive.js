/**
 * Hook pour la gestion responsive avancée
 * Détection d'appareil, orientation, taille d'écran
 */

import { useState, useEffect, useCallback } from 'react'

// Points de rupture standardisés
export const BREAKPOINTS = {
  xs: 0,      // Extra small devices (phones, portrait)
  sm: 640,    // Small devices (phones, landscape)
  md: 768,    // Medium devices (tablets)
  lg: 1024,   // Large devices (laptops)
  xl: 1280,   // Extra large devices (desktops)
  '2xl': 1536 // 2X Large devices (large desktops)
}

/**
 * Hook principal pour la responsivité
 */
export function useResponsive() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  })
  
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    orientation: 'landscape',
    platform: 'unknown',
    hasTouch: false
  })

  const [breakpoint, setBreakpoint] = useState('lg')

  /**
   * Détermine le breakpoint actuel
   */
  const getBreakpoint = useCallback((width) => {
    if (width >= BREAKPOINTS['2xl']) return '2xl'
    if (width >= BREAKPOINTS.xl) return 'xl'
    if (width >= BREAKPOINTS.lg) return 'lg'
    if (width >= BREAKPOINTS.md) return 'md'
    if (width >= BREAKPOINTS.sm) return 'sm'
    return 'xs'
  }, [])

  /**
   * Détecte le type d'appareil
   */
  const detectDevice = useCallback(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        orientation: 'landscape',
        platform: 'unknown',
        hasTouch: false
      }
    }

    const userAgent = navigator.userAgent || navigator.vendor || window.opera
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    
    // Détection iOS
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream
    
    // Détection Android
    const isAndroid = /android/i.test(userAgent)
    
    // Détection mobile
    const isMobile = /Mobi|Android/i.test(userAgent) || windowSize.width < BREAKPOINTS.md
    
    // Détection tablette
    const isTablet = (
      (isIOS && windowSize.width >= 768) ||
      (isAndroid && windowSize.width >= 768 && windowSize.width < 1024) ||
      (windowSize.width >= BREAKPOINTS.md && windowSize.width < BREAKPOINTS.lg && hasTouch)
    )
    
    // Orientation
    const orientation = windowSize.width > windowSize.height ? 'landscape' : 'portrait'
    
    // Plateforme
    let platform = 'desktop'
    if (isIOS) platform = 'ios'
    else if (isAndroid) platform = 'android'
    else if (isMobile) platform = 'mobile'

    return {
      isMobile: isMobile && !isTablet,
      isTablet,
      isDesktop: !isMobile && !isTablet,
      orientation,
      platform,
      hasTouch
    }
  }, [windowSize.width, windowSize.height])

  /**
   * Gère le redimensionnement de la fenêtre
   */
  const handleResize = useCallback(() => {
    const newSize = {
      width: window.innerWidth,
      height: window.innerHeight
    }
    
    setWindowSize(prevSize => {
      // Éviter les re-rendus si la taille n'a pas changé
      if (prevSize.width === newSize.width && prevSize.height === newSize.height) {
        return prevSize
      }
      return newSize
    })
    
    const newBreakpoint = getBreakpoint(newSize.width)
    setBreakpoint(prevBreakpoint => {
      if (prevBreakpoint === newBreakpoint) {
        return prevBreakpoint
      }
      return newBreakpoint
    })
  }, [getBreakpoint])

  // Effet pour mettre à jour deviceInfo quand windowSize change
  useEffect(() => {
    const newDeviceInfo = detectDevice()
    setDeviceInfo(prevInfo => {
      // Comparaison shallow pour éviter les re-rendus inutiles
      if (JSON.stringify(prevInfo) === JSON.stringify(newDeviceInfo)) {
        return prevInfo
      }
      return newDeviceInfo
    })
  }, [detectDevice])

  // Effet pour l'initialisation et les listeners
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Initialisation
    handleResize()

    // Event listeners avec debounce pour éviter trop d'appels
    let timeoutId
    const debouncedHandleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(handleResize, 100) // 100ms de debounce
    }

    window.addEventListener('resize', debouncedHandleResize)
    window.addEventListener('orientationchange', debouncedHandleResize)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', debouncedHandleResize)
      window.removeEventListener('orientationchange', debouncedHandleResize)
    }
  }, [handleResize])

  /**
   * Utilitaires pour vérifier les breakpoints
   */
  const is = useCallback((size) => {
    return breakpoint === size
  }, [breakpoint])

  const isAtLeast = useCallback((size) => {
    const currentIndex = Object.keys(BREAKPOINTS).indexOf(breakpoint)
    const targetIndex = Object.keys(BREAKPOINTS).indexOf(size)
    return currentIndex >= targetIndex
  }, [breakpoint])

  const isBelow = useCallback((size) => {
    const currentIndex = Object.keys(BREAKPOINTS).indexOf(breakpoint)
    const targetIndex = Object.keys(BREAKPOINTS).indexOf(size)
    return currentIndex < targetIndex
  }, [breakpoint])

  return {
    // Informations sur la fenêtre
    windowSize,
    breakpoint,
    
    // Informations sur l'appareil
    ...deviceInfo,
    
    // Utilitaires
    is,
    isAtLeast,
    isBelow,
    
    // Classes CSS helpers
    className: {
      mobile: deviceInfo.isMobile ? 'mobile' : '',
      tablet: deviceInfo.isTablet ? 'tablet' : '',
      desktop: deviceInfo.isDesktop ? 'desktop' : '',
      touch: deviceInfo.hasTouch ? 'touch' : 'no-touch',
      orientation: deviceInfo.orientation,
      platform: deviceInfo.platform
    }
  }
}

/**
 * Hook pour masquer/afficher selon la taille d'écran
 */
export function useBreakpoint(minSize, maxSize = null) {
  const { isAtLeast, isBelow } = useResponsive()
  
  if (maxSize) {
    return isAtLeast(minSize) && isBelow(maxSize)
  }
  
  return isAtLeast(minSize)
}

/**
 * Hook pour l'orientation
 */
export function useOrientation() {
  const { orientation, windowSize } = useResponsive()
  
  return {
    orientation,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
    aspectRatio: windowSize.width / windowSize.height
  }
}

/**
 * Hook pour les interactions tactiles
 */
export function useTouch() {
  const { hasTouch, isMobile, isTablet } = useResponsive()
  
  return {
    hasTouch,
    isTouchDevice: hasTouch && (isMobile || isTablet),
    preferTouch: isMobile || isTablet
  }
}

/**
 * Hook pour adapter le contenu selon l'appareil
 */
export function useAdaptiveContent() {
  const responsive = useResponsive()
  
  const getItemsPerPage = useCallback((base = 12) => {
    if (responsive.isMobile) return Math.max(4, Math.floor(base / 3))
    if (responsive.isTablet) return Math.max(6, Math.floor(base / 2))
    return base
  }, [responsive])
  
  const getGridCols = useCallback((desktop = 4) => {
    if (responsive.isMobile) return 1
    if (responsive.isTablet) return Math.min(2, desktop)
    if (responsive.isBelow('lg')) return Math.min(3, desktop)
    return desktop
  }, [responsive])
  
  const getSidebarWidth = useCallback(() => {
    if (responsive.isMobile) return 'full'
    if (responsive.isTablet) return '80%'
    return '320px'
  }, [responsive])

  return {
    ...responsive,
    getItemsPerPage,
    getGridCols,
    getSidebarWidth
  }
}

/**
 * HOC pour rendre un composant responsive
 */
export function withResponsive(Component) {
  return function ResponsiveComponent(props) {
    const responsive = useResponsive()
    
    return (
      <div className={Object.values(responsive.className).join(' ')}>
        <Component {...props} responsive={responsive} />
      </div>
    )
  }
}

export default useResponsive
