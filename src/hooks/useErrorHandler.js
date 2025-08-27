/**
 * Hook React pour la gestion d'erreurs côté client
 * Intégré avec le système de gestion d'erreurs global
 */

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

// Configuration par défaut
const DEFAULT_CONFIG = {
  logErrors: true,
  showNotifications: true,
  retryOnFailure: false,
  maxRetries: 3,
  retryDelay: 1000,
  fallbackValue: null
}

/**
 * Types d'erreurs côté client
 */
export const CLIENT_ERROR_TYPES = {
  NETWORK: 'NETWORK',
  VALIDATION: 'VALIDATION',
  AUTHENTICATION: 'AUTHENTICATION',
  AUTHORIZATION: 'AUTHORIZATION',
  API: 'API',
  UI: 'UI',
  PAYMENT: 'PAYMENT',
  UNKNOWN: 'UNKNOWN'
}

/**
 * Niveaux de sévérité
 */
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
}

/**
 * Hook principal pour la gestion d'erreurs
 */
export function useErrorHandler(config = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  const { user } = useAuth()
  const [errors, setErrors] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  /**
   * Classifie automatiquement une erreur
   */
  const classifyError = useCallback((error) => {
    const message = error.message?.toLowerCase() || ''
    const status = error.status || error.code
    
    // Classification par status HTTP
    if (status === 401) return CLIENT_ERROR_TYPES.AUTHENTICATION
    if (status === 403) return CLIENT_ERROR_TYPES.AUTHORIZATION
    if (status >= 400 && status < 500) return CLIENT_ERROR_TYPES.API
    if (status >= 500) return CLIENT_ERROR_TYPES.NETWORK
    
    // Classification par message
    if (message.includes('network') || message.includes('fetch')) {
      return CLIENT_ERROR_TYPES.NETWORK
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return CLIENT_ERROR_TYPES.VALIDATION
    }
    if (message.includes('unauthorized') || message.includes('auth')) {
      return CLIENT_ERROR_TYPES.AUTHENTICATION
    }
    if (message.includes('payment') || message.includes('transaction')) {
      return CLIENT_ERROR_TYPES.PAYMENT
    }
    
    return CLIENT_ERROR_TYPES.UNKNOWN
  }, [])

  /**
   * Détermine la sévérité d'une erreur
   */
  const determineSeverity = useCallback((errorType, error) => {
    switch (errorType) {
      case CLIENT_ERROR_TYPES.PAYMENT:
        return ERROR_SEVERITY.CRITICAL
      case CLIENT_ERROR_TYPES.AUTHENTICATION:
      case CLIENT_ERROR_TYPES.AUTHORIZATION:
        return ERROR_SEVERITY.HIGH
      case CLIENT_ERROR_TYPES.API:
      case CLIENT_ERROR_TYPES.NETWORK:
        return ERROR_SEVERITY.MEDIUM
      default:
        return ERROR_SEVERITY.LOW
    }
  }, [])

  /**
   * Génère un contexte d'erreur enrichi
   */
  const createErrorContext = useCallback((error, additionalContext = {}) => {
    const errorType = classifyError(error)
    const severity = determineSeverity(errorType, error)
    
    return {
      id: `client_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      type: errorType,
      severity,
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: user?.id,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      ...additionalContext
    }
  }, [classifyError, determineSeverity, user])

  /**
   * Log une erreur vers le serveur
   */
  const logErrorToServer = useCallback(async (errorContext) => {
    if (!finalConfig.logErrors) return

    try {
      await fetch('/api/errors/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorContext)
      })
    } catch (logError) {
      console.error('Failed to log error to server:', logError)
    }
  }, [finalConfig.logErrors])

  /**
   * Affiche une notification d'erreur
   */
  const showErrorNotification = useCallback((errorContext) => {
    if (!finalConfig.showNotifications) return

    // Ici vous pouvez intégrer votre système de notifications
    // Par exemple: toast, modal, etc.
    console.error('Error occurred:', errorContext)
    
    // Exemple avec une notification simple
    if ('Notification' in window && Notification.permission === 'granted') {
      if (errorContext.severity === ERROR_SEVERITY.CRITICAL) {
        new Notification('Erreur critique', {
          body: errorContext.message,
          icon: '/error-icon.png'
        })
      }
    }
  }, [finalConfig.showNotifications])

  /**
   * Fonction principale pour gérer une erreur
   */
  const handleError = useCallback(async (error, context = {}) => {
    const errorContext = createErrorContext(error, context)
    
    // Ajouter à la liste des erreurs locales
    setErrors(prev => [errorContext, ...prev.slice(0, 99)]) // Garder max 100 erreurs
    
    // Log vers le serveur
    await logErrorToServer(errorContext)
    
    // Afficher notification
    showErrorNotification(errorContext)
    
    return errorContext
  }, [createErrorContext, logErrorToServer, showErrorNotification])

  /**
   * Exécute une fonction avec gestion d'erreurs automatique
   */
  const withErrorHandling = useCallback((asyncFunction, context = {}) => {
    return async (...args) => {
      try {
        setIsLoading(true)
        const result = await asyncFunction(...args)
        return result
      } catch (error) {
        const errorContext = await handleError(error, context)
        
        // Retourner la valeur de fallback si configurée
        if (finalConfig.fallbackValue !== null) {
          return finalConfig.fallbackValue
        }
        
        throw error
      } finally {
        setIsLoading(false)
      }
    }
  }, [handleError, finalConfig.fallbackValue])

  /**
   * Exécute une fonction avec retry automatique
   */
  const withRetry = useCallback((asyncFunction, retryConfig = {}) => {
    const config = {
      maxRetries: finalConfig.maxRetries,
      retryDelay: finalConfig.retryDelay,
      ...retryConfig
    }
    
    return async (...args) => {
      let lastError
      let attempt = 0
      
      while (attempt <= config.maxRetries) {
        try {
          setIsLoading(true)
          const result = await asyncFunction(...args)
          return result
        } catch (error) {
          lastError = error
          attempt++
          
          // Log de la tentative
          await handleError(error, {
            attempt,
            maxRetries: config.maxRetries,
            retryOperation: true
          })
          
          // Si c'est la dernière tentative, on throw
          if (attempt > config.maxRetries) {
            throw error
          }
          
          // Attendre avant la prochaine tentative
          await new Promise(resolve => 
            setTimeout(resolve, config.retryDelay * attempt)
          )
        } finally {
          if (attempt > config.maxRetries) {
            setIsLoading(false)
          }
        }
      }
      
      throw lastError
    }
  }, [handleError, finalConfig.maxRetries, finalConfig.retryDelay])

  /**
   * Nettoie les erreurs anciennes
   */
  const clearErrors = useCallback((maxAge = 60000) => {
    const cutoff = Date.now() - maxAge
    setErrors(prev => prev.filter(error => 
      new Date(error.timestamp).getTime() > cutoff
    ))
  }, [])

  /**
   * Obtient les erreurs par type
   */
  const getErrorsByType = useCallback((type) => {
    return errors.filter(error => error.type === type)
  }, [errors])

  /**
   * Obtient les erreurs par sévérité
   */
  const getErrorsBySeverity = useCallback((severity) => {
    return errors.filter(error => error.severity === severity)
  }, [errors])

  /**
   * Statistiques des erreurs
   */
  const getErrorStats = useCallback(() => {
    const stats = {
      total: errors.length,
      byType: {},
      bySeverity: {},
      recent: errors.filter(error => 
        Date.now() - new Date(error.timestamp).getTime() < 300000 // 5 minutes
      ).length
    }
    
    errors.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1
    })
    
    return stats
  }, [errors])

  // Nettoyage automatique des erreurs anciennes
  useEffect(() => {
    const interval = setInterval(() => {
      clearErrors(300000) // Nettoyer les erreurs > 5 minutes
    }, 60000) // Vérifier chaque minute
    
    return () => clearInterval(interval)
  }, [clearErrors])

  // Demander permission pour les notifications
  useEffect(() => {
    if (finalConfig.showNotifications && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }
  }, [finalConfig.showNotifications])

  return {
    // Erreurs
    errors,
    recentErrors: errors.slice(0, 10),
    criticalErrors: getErrorsBySeverity(ERROR_SEVERITY.CRITICAL),
    
    // État
    isLoading,
    hasErrors: errors.length > 0,
    
    // Fonctions principales
    handleError,
    withErrorHandling,
    withRetry,
    
    // Utilitaires
    clearErrors,
    getErrorsByType,
    getErrorsBySeverity,
    getErrorStats,
    
    // Constantes
    ERROR_TYPES: CLIENT_ERROR_TYPES,
    SEVERITY: ERROR_SEVERITY
  }
}

/**
 * Hook simplifié pour les erreurs API
 */
export function useApiErrorHandler() {
  const { handleError, withErrorHandling, withRetry } = useErrorHandler({
    logErrors: true,
    showNotifications: true,
    retryOnFailure: true,
    maxRetries: 2
  })
  
  const handleApiError = useCallback(async (error, endpoint) => {
    return await handleError(error, {
      endpoint,
      apiError: true,
      timestamp: Date.now()
    })
  }, [handleError])
  
  return {
    handleApiError,
    withErrorHandling,
    withRetry
  }
}

/**
 * Hook pour les erreurs de paiement
 */
export function usePaymentErrorHandler() {
  const { handleError, withRetry } = useErrorHandler({
    logErrors: true,
    showNotifications: true,
    retryOnFailure: false // Les paiements ne doivent pas être retry automatiquement
  })
  
  const handlePaymentError = useCallback(async (error, paymentContext) => {
    return await handleError(error, {
      ...paymentContext,
      paymentError: true,
      severity: ERROR_SEVERITY.CRITICAL
    })
  }, [handleError])
  
  return {
    handlePaymentError,
    withRetry
  }
}

/**
 * Provider de contexte global pour les erreurs
 */
import { createContext, useContext } from 'react'

const ErrorContext = createContext()

export function ErrorProvider({ children, config = {} }) {
  const errorHandler = useErrorHandler(config)
  
  return (
    <ErrorContext.Provider value={errorHandler}>
      {children}
    </ErrorContext.Provider>
  )
}

export function useGlobalErrorHandler() {
  const context = useContext(ErrorContext)
  if (!context) {
    throw new Error('useGlobalErrorHandler must be used within ErrorProvider')
  }
  return context
}

export default useErrorHandler
