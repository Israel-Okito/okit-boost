// src/lib/services/cinetpay.js
import crypto from 'crypto'
import { cinetpayConfig } from '@/lib/config/cinetpay'

/**
 * Service CinetPay optimisé pour les paiements mobile money en RDC
 */


export class CinetPayService {
  constructor() {
    this.config = cinetpayConfig
    this.validateConfig()
  }
  

  /**
   * Valider la configuration au démarrage
   */
  validateConfig() {
    const required = ['apiKey', 'siteId', 'secretKey', 'notifyUrl', 'returnUrl', 'cancelUrl']
    const missing = required.filter(key => !this.config[key])
    
    if (missing.length > 0) {
      throw new Error(`Configuration CinetPay manquante: ${missing.join(', ')}`)
    }
  }

  /**
   * Créer un lien de paiement sécurisé
   */
  async createPaymentLink(paymentData) {
    try {
      // Validation approfondie des données
      this.validatePaymentData(paymentData)

      // Préparation du payload avec tous les champs requis
      const payload = {
        apikey: this.config.apiKey,
        site_id: this.config.siteId,
        transaction_id: paymentData.transactionId,
        amount: parseInt(paymentData.amount), // CinetPay attend un entier
        currency: paymentData.currency,
        description: this.sanitizeString(paymentData.description),
        
        // Informations client nettoyées
        customer_name: this.sanitizeString(paymentData.customerName),
        customer_surname: this.sanitizeString(paymentData.customerSurname || paymentData.customerName.split(' ').slice(-1)[0] || '-'),
        customer_email: paymentData.customerEmail.toLowerCase().trim(),
        customer_phone_number: this.formatPhoneNumber(paymentData.customerPhone),
        customer_address: this.sanitizeString(paymentData.customerAddress || 'Kinshasa'),
        customer_city: this.sanitizeString(paymentData.customerCity || 'Kinshasa'),
        customer_country: paymentData.customerCountry || 'CD',
        customer_state: this.sanitizeString(paymentData.customerState || 'Kinshasa'),
        customer_zip_code: paymentData.customerZipCode || '00000',
        
        // URLs de callback sécurisées
        notify_url: this.config.notifyUrl,
        return_url: `${this.config.returnUrl}?transaction_id=${paymentData.transactionId}&token=${this.generateSecureToken()}`,
        cancel_url: `${this.config.cancelUrl}?transaction_id=${paymentData.transactionId}`,
        
        // Configuration canaux et langue
        // channels: this.getOptimizedChannels(paymentData.channels, paymentData.customerCountry),
        channels: "ALL",
        
        lang: 'fr',
        
        // Métadonnées structurées
        metadata: JSON.stringify({
          orderId: paymentData.metadata?.orderId,
          orderNumber: paymentData.metadata?.orderNumber,
          userId: paymentData.metadata?.userId,
          timestamp: new Date().toISOString(),
          version: '2.0'
        })
      }

      console.log('Payload CinetPay:', JSON.stringify(payload, null, 2))

      const response = await this.makeSecureRequest('/payment', 'POST', payload)
      
      if (response.code !== '201') {
        throw new Error(`Erreur CinetPay [${response.code}]: ${response.message || 'Erreur inconnue'}`)
      }

      return {
        success: true,
        paymentToken: response.data.payment_token,
        paymentUrl: response.data.payment_url,
        transactionId: paymentData.transactionId,
        expiresAt: this.calculateExpirationTime(),
        metadata: {
          channels: payload.channels,
          currency: payload.currency,
          amount: payload.amount
        }
      }
    } catch (error) {
      console.error('Erreur création lien paiement CinetPay:', error)
      this.logError('createPaymentLink', error, paymentData)
      throw new Error(`Échec de création du lien de paiement: ${error.message}`)
    }
  }

  /**
   * Vérifier le statut d'une transaction avec retry automatique
   */
  async checkTransactionStatus(transactionId, paymentToken = null, retryCount = 0) {
    const MAX_RETRIES = 3
    
    try {
      const payload = {
        apikey: this.config.apiKey,
        site_id: this.config.siteId,
        transaction_id: transactionId
      }

      if (paymentToken) {
        payload.token = paymentToken
      }

      const response = await this.makeSecureRequest('/payment/check', 'POST', payload)
      
      if (response.code !== '00') {
        throw new Error(`Erreur vérification [${response.code}]: ${response.message}`)
      }

      return {
        success: true,
        transactionId: transactionId,
        status: response.data.status,
        amount: parseFloat(response.data.amount),
        currency: response.data.currency,
        operatorId: response.data.operator_id,
        paymentMethod: response.data.payment_method,
        paymentDate: response.data.payment_date,
        metadata: this.parseMetadata(response.data.metadata),
        description: response.data.description,
        customerPhone: response.data.customer_phone_number,
        lastChecked: new Date().toISOString()
      }
    } catch (error) {
      console.error(`Erreur vérification statut (tentative ${retryCount + 1}):`, error)
      
      // Retry automatique en cas d'erreur réseau
      if (retryCount < MAX_RETRIES && this.isRetryableError(error)) {
        await this.delay(1000 * (retryCount + 1)) // Backoff exponentiel
        return this.checkTransactionStatus(transactionId, paymentToken, retryCount + 1)
      }
      
      throw error
    }
  }

  /**
   * Traiter une notification webhook avec validation de sécurité renforcée
   */
  processWebhookNotification(payload) {
    try {
      console.log('Webhook reçu:', JSON.stringify(payload, null, 2))

      // Vérification de la signature obligatoire
      if (!this.verifyWebhookSignature(payload)) {
        throw new Error('Signature webhook invalide - tentative de fraude détectée')
      }

      // Validation des champs critiques
      if (!payload.cpm_trans_id || !payload.cpm_result || !payload.cpm_amount) {
        throw new Error('Données webhook incomplètes')
      }

      // Vérification que c'est bien notre site
      if (parseInt(payload.cpm_site_id) !== this.config.siteId) {
        throw new Error('Site ID incorrect dans webhook')
      }

      const processedData = {
        transactionId: payload.cpm_trans_id,
        siteId: parseInt(payload.cpm_site_id),
        status: payload.cpm_result,
        amount: parseFloat(payload.cpm_amount),
        currency: payload.cpm_currency,
        paymentMethod: payload.payment_method || 'unknown',
        operatorId: payload.operator_id || null,
        paymentDate: payload.cpm_trans_date,
        phoneNumber: payload.cel_phone_num || null,
        signature: payload.signature,
        metadata: this.parseMetadata(payload.metadata),
        processedAt: new Date().toISOString()
      }

      // Log pour audit
      this.logWebhookEvent(processedData)

      return processedData
    } catch (error) {
      console.error('Erreur traitement webhook:', error)
      this.logError('processWebhookNotification', error, payload)
      throw error
    }
  }

  /**
   * Vérification renforcée de la signature webhook
   */
  verifyWebhookSignature(payload) {
    try {
      if (!payload.signature || !this.config.secretKey) {
        return false
      }

      // Reconstruction de la signature selon la documentation CinetPay
      const signatureParams = [
        payload.cpm_site_id,
        payload.cpm_trans_id, 
        payload.cpm_trans_date,
        payload.cpm_amount,
        payload.cpm_currency,
        payload.signature,
        this.config.secretKey
      ]

      const dataToHash = signatureParams.join('')
      const calculatedSignature = crypto
        .createHash('sha256')
        .update(dataToHash)
        .digest('hex')

      const isValid = calculatedSignature === payload.signature
      
      if (!isValid) {
        console.error('Signature invalide:', {
          received: payload.signature,
          calculated: calculatedSignature,
          dataToHash: dataToHash
        })
      }

      return isValid
    } catch (error) {
      console.error('Erreur vérification signature:', error)
      return false
    }
  }

  /**
   * Effectuer une requête HTTP sécurisée avec gestion d'erreur avancée
   */
  async makeSecureRequest(endpoint, method = 'POST', data = null, timeout = 30000) {
    const url = `${this.config.baseUrl}${endpoint}`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'OkitBoost-CinetPay/2.0',
          'X-Request-ID': this.generateRequestId()
        },
        signal: controller.signal
      }

      if (data) {
        options.body = JSON.stringify(data)
      }

      console.log(`[CinetPay] ${method} ${url}`)
      
      const response = await fetch(url, options)
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      // Log de la réponse pour debug
      console.log('[CinetPay] Réponse:', JSON.stringify(result, null, 2))
      
      return result
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error.name === 'AbortError') {
        throw new Error(`Timeout de ${timeout}ms dépassé pour ${endpoint}`)
      }
      
      throw error
    }
  }

  /**
   * Validation renforcée des données de paiement
   */
  validatePaymentData(data) {
    const errors = []

    // Validation des champs obligatoires
    const required = ['transactionId', 'amount', 'currency', 'customerName', 'customerEmail', 'customerPhone', 'description']
    required.forEach(field => {
      if (!data[field]) errors.push(`${field} est requis`)
    })

    // Validation du montant
    if (data.amount && (data.amount <= 0 || data.amount > 10000000)) {
      errors.push('Montant invalide (doit être entre 1 et 10,000,000)')
    }

    // Validation de la devise
    if (data.currency && !['CDF', 'USD'].includes(data.currency)) {
      errors.push('Devise non supportée (CDF ou USD uniquement)')
    }

    // Validation email
    if (data.customerEmail && !this.isValidEmail(data.customerEmail)) {
      errors.push('Format email invalide')
    }

    // Validation téléphone
    if (data.customerPhone && !this.isValidPhoneNumber(data.customerPhone)) {
      errors.push('Format téléphone invalide (format international requis)')
    }

    // Validation transaction ID
    if (data.transactionId && (data.transactionId.length < 5 || data.transactionId.length > 50)) {
      errors.push('Transaction ID invalide (5-50 caractères)')
    }

    if (errors.length > 0) {
      throw new Error(`Données invalides: ${errors.join(', ')}`)
    }

    return true
  }

  /**
   * Utilitaires de validation
   */
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  isValidPhoneNumber(phone) {
    // Formats supportés: +243XXXXXXXXX, 243XXXXXXXXX, 0XXXXXXXXX
    const cleaned = phone.replace(/\s|-/g, '')
    return /^(\+?243|0)[0-9]{9}$/.test(cleaned)
  }

  // ✅ méthode utilitaire pour nettoyer les chaînes
  sanitizeString(str) {
    if (!str) return '';
    return String(str)
      .replace(/[^\w\s.@-]/gi, '') // garde caractères autorisés
      .trim();
  }
  

  isRetryableError(error) {
    const retryableMessages = ['ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT', 'Network Error']
    return retryableMessages.some(msg => error.message.includes(msg))
  }

  /**
   * Utilitaires de formatage
   */
  formatPhoneNumber(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      return '243' + cleaned.substring(1); // RDC
    }
    return cleaned.startsWith('243') ? cleaned : '243' + cleaned;
  }
  

  parseMetadata(metadata) {
    try {
      return typeof metadata === 'string' ? JSON.parse(metadata) : metadata
    } catch {
      return {}
    }
  }

  /**
   * Génération d'identifiants sécurisés
   */
  // generateTransactionId() {
  //   const timestamp = Date.now()
  //   const random = crypto.randomBytes(8).toString('hex').toUpperCase()
  //   return `OKIT_${timestamp}_${random}`
  // }

  generateTransactionId() {
    return 'OKIT' + Date.now() + Math.random().toString(36).substring(2, 10).toUpperCase();
  }
  

  generateRequestId() {
    return crypto.randomBytes(16).toString('hex')
  }

  generateSecureToken() {
    return crypto.randomBytes(32).toString('hex')
  }



/**
 * Configuration optimisée des canaux de paiement
 */
getOptimizedChannels(requestedChannels, country = "CD") {
  if (!requestedChannels) {
    // Défaut par pays
    if (country === "CD") {
      return "ORANGE_MONEY_CD,AIRTEL_MONEY_CD,MPESA_CD";
    }
    return "ALL";
  }

  // Si c'est ALL (maj/minuscules peu importe)
  if (requestedChannels.toUpperCase() === "ALL") {
    return "ALL";
  }

  // Si c'est déjà un code officiel, on le garde
  if (requestedChannels.includes("_")) {
    return requestedChannels;
  }

  // Sinon → mapping simplifié vers officiel
  const CHANNELS_MAP = {
    orange: "ORANGE_MONEY_CD",
    airtel: "AIRTEL_MONEY_CD",
    mpesa: "MPESA_CD",
    visa: "VISA",
    mastercard: "MASTERCARD",
  };

  return CHANNELS_MAP[requestedChannels.toLowerCase()] || "ALL";
}





  /**
   * Calcul du temps d'expiration
   */
  calculateExpirationTime() {
    const expirationDate = new Date()
    expirationDate.setMinutes(expirationDate.getMinutes() + 30) // 30 minutes
    return expirationDate.toISOString()
  }

  /**
   * Utilitaires de logging et monitoring
   */
  logError(operation, error, data = null) {
    console.error(`[CinetPay Error] ${operation}:`, {
      error: error.message,
      stack: error.stack,
      data: data,
      timestamp: new Date().toISOString()
    })
  }

  logWebhookEvent(data) {
    console.log('[CinetPay Webhook]:', {
      transactionId: data.transactionId,
      status: data.status,
      amount: data.amount,
      timestamp: data.processedAt
    })
  }

  /**
   * Utilitaires async
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Méthodes de remboursement et annulation (pour usage futur)
   */
  async refundTransaction(transactionId, amount = null, reason = '') {
    try {
      const payload = {
        apikey: this.config.apiKey,
        site_id: this.config.siteId,
        transaction_id: transactionId,
        reason: this.sanitizeString(reason)
      }

      if (amount) {
        payload.amount = parseInt(amount)
      }

      const response = await this.makeSecureRequest('/payment/refund', 'POST', payload)
      
      return {
        success: response.code === '00',
        refundId: response.data?.refund_id,
        message: response.message,
        processedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('Erreur remboursement:', error)
      throw error
    }
  }

  async cancelTransaction(transactionId, reason = '') {
    try {
      const payload = {
        apikey: this.config.apiKey,
        site_id: this.config.siteId,
        transaction_id: transactionId,
        reason: this.sanitizeString(reason)
      }

      const response = await this.makeSecureRequest('/payment/cancel', 'POST', payload)
      
      return {
        success: response.code === '00',
        message: response.message,
        cancelledAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('Erreur annulation:', error)
      throw error
    }
  }
}

// Instance singleton exportée
export const cinetPayService = new CinetPayService()