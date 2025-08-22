// src/lib/services/cinetpay.js
import crypto from 'crypto'
import { cinetpayConfig } from '@/lib/config/cinetpay'

export class CinetPayService {
  constructor() {
    this.config = cinetpayConfig
  }

  /**
   * Créer un lien de paiement
   */
  async createPaymentLink(paymentData) {
    try {
      const payload = {
        apikey: this.config.apiKey,
        site_id: this.config.siteId,
        transaction_id: paymentData.transactionId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        alternative_currency: paymentData.alternativeCurrency || '',
        description: paymentData.description,
        customer_name: paymentData.customerName,
        customer_surname: paymentData.customerSurname || '',
        customer_email: paymentData.customerEmail,
        customer_phone_number: paymentData.customerPhone,
        customer_address: paymentData.customerAddress || '',
        customer_city: paymentData.customerCity || 'Kinshasa',
        customer_country: paymentData.customerCountry || 'CD',
        customer_state: paymentData.customerState || '',
        customer_zip_code: paymentData.customerZipCode || '',
        notify_url: this.config.notifyUrl,
        return_url: `${this.config.returnUrl}?transaction_id=${paymentData.transactionId}`,
        cancel_url: `${this.config.cancelUrl}?transaction_id=${paymentData.transactionId}`,
        channels: paymentData.channels || 'ALL',
        metadata: paymentData.metadata || '',
        lang: paymentData.lang || 'fr'
      }

      const response = await this.makeRequest('/payment', 'POST', payload)
      
      if (response.code !== '201') {
        throw new Error(`Erreur CinetPay: ${response.message}`)
      }

      return {
        success: true,
        paymentToken: response.data.payment_token,
        paymentUrl: response.data.payment_url,
        transactionId: paymentData.transactionId
      }
    } catch (error) {
      console.error('Erreur création lien paiement CinetPay:', error)
      throw error
    }
  }

  /**
   * Vérifier le statut d'une transaction
   */
  async checkTransactionStatus(transactionId, paymentToken = null) {
    try {
      const payload = {
        apikey: this.config.apiKey,
        site_id: this.config.siteId,
        transaction_id: transactionId
      }

      if (paymentToken) {
        payload.token = paymentToken
      }

      const response = await this.makeRequest('/payment/check', 'POST', payload)
      
      return {
        success: true,
        status: response.data.status,
        amount: response.data.amount,
        currency: response.data.currency,
        operator_id: response.data.operator_id,
        payment_method: response.data.payment_method,
        metadata: response.data.metadata,
        description: response.data.description
      }
    } catch (error) {
      console.error('Erreur vérification statut CinetPay:', error)
      throw error
    }
  }

  /**
   * Traiter une notification webhook
   */
  processWebhookNotification(payload) {
    try {
      // Vérifier la signature pour la sécurité
      if (!this.verifyWebhookSignature(payload)) {
        throw new Error('Signature webhook invalide')
      }

      return {
        transactionId: payload.cpm_trans_id,
        status: payload.cpm_result,
        amount: parseFloat(payload.cpm_amount),
        currency: payload.cpm_currency,
        paymentMethod: payload.payment_method,
        operatorId: payload.operator_id,
        signature: payload.signature
      }
    } catch (error) {
      console.error('Erreur traitement webhook CinetPay:', error)
      throw error
    }
  }

  /**
   * Vérifier la signature d'un webhook
   */
  verifyWebhookSignature(payload) {
    try {
      // CinetPay envoie une signature basée sur certains champs
      const dataToHash = [
        payload.cpm_site_id,
        payload.cpm_trans_id,
        payload.cpm_trans_date,
        payload.cpm_amount,
        payload.cpm_currency,
        payload.signature
      ].join('')

      const hash = crypto
        .createHmac('sha256', this.config.secretKey)
        .update(dataToHash)
        .digest('hex')

      return hash === payload.signature
    } catch (error) {
      console.error('Erreur vérification signature:', error)
      return false
    }
  }

  /**
   * Annuler une transaction
   */
  async cancelTransaction(transactionId) {
    try {
      const payload = {
        apikey: this.config.apiKey,
        site_id: this.config.siteId,
        transaction_id: transactionId
      }

      const response = await this.makeRequest('/payment/cancel', 'POST', payload)
      
      return {
        success: response.code === '00',
        message: response.message
      }
    } catch (error) {
      console.error('Erreur annulation transaction CinetPay:', error)
      throw error
    }
  }

  /**
   * Effectuer un remboursement
   */
  async refundTransaction(transactionId, amount = null) {
    try {
      const payload = {
        apikey: this.config.apiKey,
        site_id: this.config.siteId,
        transaction_id: transactionId
      }

      if (amount) {
        payload.amount = amount
      }

      const response = await this.makeRequest('/payment/refund', 'POST', payload)
      
      return {
        success: response.code === '00',
        message: response.message,
        refundId: response.data?.refund_id
      }
    } catch (error) {
      console.error('Erreur remboursement CinetPay:', error)
      throw error
    }
  }

  /**
   * Faire une requête HTTP à l'API CinetPay
   */
  async makeRequest(endpoint, method = 'POST', data = null) {
    const url = `${this.config.baseUrl}${endpoint}`
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }

    if (data) {
      options.body = JSON.stringify(data)
    }

    const response = await fetch(url, options)
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    
    return result
  }

  /**
   * Générer un ID de transaction unique
   */
  generateTransactionId() {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    return `OKIT_${timestamp}_${random}`.toUpperCase()
  }

  /**
   * Valider les données de paiement
   */
  validatePaymentData(paymentData) {
    const requiredFields = [
      'amount',
      'currency', 
      'customerName',
      'customerEmail',
      'customerPhone',
      'description'
    ]

    for (const field of requiredFields) {
      if (!paymentData[field]) {
        throw new Error(`Champ requis manquant: ${field}`)
      }
    }

    // Valider le montant
    if (paymentData.amount <= 0) {
      throw new Error('Le montant doit être supérieur à 0')
    }

    // Valider la devise
    if (!Object.values(this.config.currencies).includes(paymentData.currency)) {
      throw new Error(`Devise non supportée: ${paymentData.currency}`)
    }

    // Valider l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(paymentData.customerEmail)) {
      throw new Error('Format email invalide')
    }

    // Valider le téléphone
    const phoneRegex = /^\+?[1-9]\d{1,14}$/
    if (!phoneRegex.test(paymentData.customerPhone.replace(/\s/g, ''))) {
      throw new Error('Format téléphone invalide')
    }

    return true
  }

  /**
   * Mapper les canaux de paiement selon le pays/opérateur
   */
  getPaymentChannels(paymentMethod, country = 'CD') {
    const channelMap = {
      'orange': {
        'CD': 'ORANGE_MONEY_CD',
        'CI': 'ORANGE_MONEY_CI',
        'CM': 'ORANGE_MONEY_CM',
        'SN': 'ORANGE_MONEY_SN'
      },
      'airtel': {
        'CD': 'AIRTEL_MONEY_CD',
        'default': 'AIRTEL_MONEY'
      },
      'mtn': {
        'CI': 'MTN_MONEY_CI',
        'CM': 'MTN_MONEY_CM',
        'SN': 'MTN_MONEY_SN'
      },
      'moov': {
        'CI': 'MOOV_MONEY_CI',
        'SN': 'MOOV_MONEY_SN'
      }
    }

    const channels = channelMap[paymentMethod]
    if (!channels) return 'ALL'

    return channels[country] || channels['default'] || 'ALL'
  }
}

// Instance singleton
export const cinetPayService = new CinetPayService()