// Hook pour requêtes API sécurisées
import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'

/**
 * Hook pour effectuer des requêtes API sécurisées avec CSRF et gestion d'erreurs
 */
export function useSecureAPI() {
  const [csrfToken, setCsrfToken] = useState(null)
  const [loading, setLoading] = useState(false)

  // Récupérer le token CSRF au montage
  useEffect(() => {
    const getCSRFToken = async () => {
      try {
        const response = await fetch('/api/csrf-token')
        const data = await response.json()
        
        if (data.success) {
          setCsrfToken(data.token)
          localStorage.setItem('csrf-token', data.token)
        }
      } catch (error) {
        console.warn('Impossible de récupérer le token CSRF:', error)
      }
    }

    // Essayer de récupérer depuis localStorage d'abord
    const storedToken = localStorage.getItem('csrf-token')
    if (storedToken) {
      setCsrfToken(storedToken)
    } else {
      getCSRFToken()
    }
  }, [])

  /**
   * Fonction pour effectuer une requête sécurisée
   */
  const secureRequest = useCallback(async (url, options = {}) => {
    setLoading(true)
    
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      }

      // Ajouter le token CSRF pour les requêtes modifiantes
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method?.toUpperCase())) {
        if (csrfToken) {
          headers['x-csrf-token'] = csrfToken
        } else {
          // Essayer de récupérer un nouveau token
          const tokenResponse = await fetch('/api/csrf-token')
          const tokenData = await tokenResponse.json()
          if (tokenData.success) {
            headers['x-csrf-token'] = tokenData.token
            setCsrfToken(tokenData.token)
            localStorage.setItem('csrf-token', tokenData.token)
          }
        }
      }

      const response = await fetch(url, {
        ...options,
        headers
      })

      const data = await response.json()

      if (!response.ok) {
        // Gestion spéciale des erreurs de sécurité
        if (response.status === 429) {
          toast.error(`Trop de requêtes. Réessayez dans ${data.retryAfter || 60} secondes`)
          throw new Error('RATE_LIMITED')
        }
        
        if (response.status === 403 && data.code === 'CSRF_TOKEN_INVALID') {
          toast.error('Session expirée. Veuillez recharger la page')
          // Recharger automatiquement après 2 secondes
          setTimeout(() => window.location.reload(), 2000)
          throw new Error('CSRF_INVALID')
        }

        if (response.status === 403 && data.code === 'SUSPICIOUS_ACTIVITY') {
          toast.error('Activité suspecte détectée. Veuillez contacter le support')
          throw new Error('SUSPICIOUS_ACTIVITY')
        }

        throw new Error(data.error || `Erreur ${response.status}`)
      }

      return data
    } catch (error) {
      console.error('Erreur requête sécurisée:', error)
      
      // Toast d'erreur si pas déjà affiché
      if (!['RATE_LIMITED', 'CSRF_INVALID', 'SUSPICIOUS_ACTIVITY'].includes(error.message)) {
        toast.error(error.message || 'Erreur de communication avec le serveur')
      }
      
      throw error
    } finally {
      setLoading(false)
    }
  }, [csrfToken])

  /**
   * Méthodes de requête spécialisées
   */
  const get = useCallback((url, options = {}) => {
    return secureRequest(url, { ...options, method: 'GET' })
  }, [secureRequest])

  const post = useCallback((url, data, options = {}) => {
    return secureRequest(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    })
  }, [secureRequest])

  const put = useCallback((url, data, options = {}) => {
    return secureRequest(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }, [secureRequest])

  const del = useCallback((url, options = {}) => {
    return secureRequest(url, { ...options, method: 'DELETE' })
  }, [secureRequest])

  /**
   * Fonction spécialisée pour les paiements
   */
  const createPayment = useCallback(async (paymentData) => {
    try {
      const result = await post('/api/payments/cinetpay', paymentData)
      
      if (result.success) {
        toast.success('Redirection vers le paiement...')
        
        // Sauvegarder les infos de transaction
        localStorage.setItem('payment_transaction', JSON.stringify({
          transactionId: result.transactionId,
          amount: result.amount,
          currency: result.currency,
          timestamp: new Date().toISOString()
        }))
        
        // Redirection vers CinetPay
        window.location.href = result.paymentUrl
      }
      
      return result
    } catch (error) {
      throw error
    }
  }, [post])

  /**
   * Fonction pour créer une commande
   */
  const createOrder = useCallback(async (orderData) => {
    try {
      const result = await post('/api/orders', orderData)
      
      if (result.success) {
        toast.success('Commande créée avec succès!')
      }
      
      return result
    } catch (error) {
      throw error
    }
  }, [post])

  return {
    // État
    loading,
    csrfToken,
    
    // Méthodes génériques
    secureRequest,
    get,
    post,
    put,
    delete: del,
    
    // Méthodes spécialisées
    createPayment,
    createOrder
  }
}

/**
 * Hook pour vérifier le statut d'une transaction
 */
export function useTransactionStatus(transactionId) {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const { get } = useSecureAPI()

  const checkStatus = useCallback(async () => {
    if (!transactionId) return

    setLoading(true)
    try {
      const result = await get(`/api/payments/cinetpay?transactionId=${transactionId}`)
      setStatus(result)
      return result
    } catch (error) {
      console.error('Erreur vérification statut:', error)
      setStatus({ error: error.message })
    } finally {
      setLoading(false)
    }
  }, [transactionId, get])

  useEffect(() => {
    if (transactionId) {
      checkStatus()
    }
  }, [transactionId, checkStatus])

  return {
    status,
    loading,
    checkStatus,
    isSuccess: status?.status === 'ACCEPTED',
    isFailed: status?.status === 'REFUSED',
    isPending: status?.status === 'PENDING'
  }
}

/**
 * Hook pour gérer la sécurité des formulaires
 */
export function useSecureForm(initialData = {}) {
  const [formData, setFormData] = useState(initialData)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  // Sanitisation des données en temps réel
  const updateField = useCallback((field, value) => {
    let sanitizedValue = value

    // Sanitisation contextuelle
    if (field.includes('email')) {
      sanitizedValue = value.toLowerCase().trim()
    } else if (field.includes('phone')) {
      sanitizedValue = value.replace(/[^\d+\-\s]/g, '')
    } else if (typeof value === 'string') {
      sanitizedValue = value.replace(/[<>]/g, '').trim()
    }

    setFormData(prev => ({
      ...prev,
      [field]: sanitizedValue
    }))

    // Marquer comme touché
    setTouched(prev => ({
      ...prev,
      [field]: true
    }))

    // Validation en temps réel
    validateField(field, sanitizedValue)
  }, [])

  const validateField = useCallback((field, value) => {
    let error = null

    if (field.includes('email')) {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        error = 'Format email invalide'
      }
    } else if (field.includes('phone')) {
      if (value && !/^(\+?243|0)[0-9]{9}$/.test(value.replace(/\s|-/g, ''))) {
        error = 'Format téléphone RDC invalide'
      }
    } else if (field.includes('name')) {
      if (value && !/^[a-zA-ZÀ-ÿ\s\-']+$/.test(value)) {
        error = 'Caractères invalides dans le nom'
      }
    }

    setErrors(prev => ({
      ...prev,
      [field]: error
    }))

    return !error
  }, [])

  const validateAll = useCallback(() => {
    const allValid = Object.keys(formData).every(field => 
      validateField(field, formData[field])
    )
    
    return allValid && Object.values(errors).every(error => !error)
  }, [formData, errors, validateField])

  const reset = useCallback(() => {
    setFormData(initialData)
    setErrors({})
    setTouched({})
  }, [initialData])

  return {
    formData,
    errors,
    touched,
    updateField,
    validateField,
    validateAll,
    reset,
    isValid: Object.values(errors).every(error => !error)
  }
}
