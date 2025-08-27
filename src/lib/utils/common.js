/**
 * Utilitaires communs utilisés dans toute l'application
 */

import { CURRENCY_CONFIG, EXCHANGE_RATES } from '@/lib/constants'
import { REGEX, DATE_FORMATS } from '@/lib/constants/app'

/**
 * Formate un montant selon la devise
 */
export function formatCurrency(amount, currency = 'CDF') {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0'
  }

  const config = CURRENCY_CONFIG[currency]
  if (!config) {
    return amount.toString()
  }

  const formatter = new Intl.NumberFormat('fr-CD', {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: currency === 'USD' ? 2 : 0,
    maximumFractionDigits: currency === 'USD' ? 2 : 0
  })

  return formatter.format(amount).replace(config.code, config.symbol)
}

/**
 * Convertit un montant d'une devise à une autre
 */
export function convertCurrency(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) {
    return amount
  }

  if (fromCurrency === 'USD' && toCurrency === 'CDF') {
    return Math.round(amount * EXCHANGE_RATES.USD_TO_CDF)
  }

  if (fromCurrency === 'CDF' && toCurrency === 'USD') {
    return Math.round(amount * EXCHANGE_RATES.CDF_TO_USD * 100) / 100
  }

  return amount
}

/**
 * Formate une date selon un format spécifique
 */
export function formatDate(date, format = DATE_FORMATS.SHORT) {
  if (!date) return ''
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) {
    return ''
  }

  const options = {
    [DATE_FORMATS.SHORT]: { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    },
    [DATE_FORMATS.LONG]: { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    },
    [DATE_FORMATS.DATETIME]: { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    },
    [DATE_FORMATS.TIME]: { 
      hour: '2-digit', 
      minute: '2-digit' 
    }
  }

  return dateObj.toLocaleDateString('fr-FR', options[format] || options[DATE_FORMATS.SHORT])
}

/**
 * Calcule la différence relative de temps
 */
export function timeAgo(date) {
  if (!date) return ''
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now - dateObj) / 1000)

  if (diffInSeconds < 60) {
    return 'À l\'instant'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `Il y a ${diffInMonths} mois`
  }

  const diffInYears = Math.floor(diffInMonths / 12)
  return `Il y a ${diffInYears} an${diffInYears > 1 ? 's' : ''}`
}

/**
 * Valide un email
 */
export function validateEmail(email) {
  return REGEX.EMAIL.test(email)
}

/**
 * Valide un numéro de téléphone congolais
 */
export function validatePhoneCD(phone) {
  return REGEX.PHONE_CD.test(phone)
}

/**
 * Valide un mot de passe fort
 */
export function validatePassword(password) {
  return REGEX.PASSWORD.test(password)
}

/**
 * Valide une URL
 */
export function validateUrl(url) {
  return REGEX.URL.test(url)
}

/**
 * Génère un slug à partir d'un texte
 */
export function generateSlug(text) {
  if (!text) return ''
  
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9\s-]/g, '') // Garde uniquement lettres, chiffres, espaces et tirets
    .trim()
    .replace(/\s+/g, '-') // Remplace les espaces par des tirets
    .replace(/-+/g, '-') // Supprime les tirets multiples
}

/**
 * Génère un ID unique
 */
export function generateId(prefix = '') {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substr(2, 5)
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`
}

/**
 * Tronque un texte à une longueur donnée
 */
export function truncateText(text, maxLength = 100, suffix = '...') {
  if (!text || text.length <= maxLength) {
    return text || ''
  }
  
  return text.substr(0, maxLength - suffix.length).trim() + suffix
}

/**
 * Capitalise la première lettre de chaque mot
 */
export function capitalizeWords(text) {
  if (!text) return ''
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Formate un numéro de téléphone
 */
export function formatPhoneNumber(phone) {
  if (!phone) return ''
  
  // Supprime tous les caractères non numériques
  const cleaned = phone.replace(/\D/g, '')
  
  // Formate pour la RDC
  if (cleaned.startsWith('243')) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`
  }
  
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`
  }
  
  return phone
}

/**
 * Calcule un pourcentage
 */
export function calculatePercentage(value, total, decimals = 1) {
  if (!total || total === 0) return 0
  return Math.round((value / total) * 100 * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

/**
 * Formate un nombre avec séparateurs de milliers
 */
export function formatNumber(number, locale = 'fr-FR') {
  if (typeof number !== 'number' || isNaN(number)) {
    return '0'
  }
  
  return new Intl.NumberFormat(locale).format(number)
}

/**
 * Debounce une fonction
 */
export function debounce(func, wait, immediate = false) {
  let timeout
  
  return function executedFunction(...args) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }
    
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    
    if (callNow) func(...args)
  }
}

/**
 * Throttle une fonction
 */
export function throttle(func, limit) {
  let inThrottle
  
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Copie du texte dans le presse-papiers
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // Fallback pour les navigateurs plus anciens
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      try {
        document.execCommand('copy')
        return true
      } catch (err) {
        return false
      } finally {
        document.body.removeChild(textArea)
      }
    }
  } catch (err) {
    return false
  }
}

/**
 * Télécharge un fichier
 */
export function downloadFile(data, filename, type = 'application/octet-stream') {
  const file = new Blob([data], { type })
  const a = document.createElement('a')
  const url = URL.createObjectURL(file)
  
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 0)
}

/**
 * Détecte le type d'appareil
 */
export function getDeviceType() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera
  
  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return 'ios'
  }
  
  if (/android/i.test(userAgent)) {
    return 'android'
  }
  
  if (/Mobi|Android/i.test(userAgent)) {
    return 'mobile'
  }
  
  return 'desktop'
}

/**
 * Génère une couleur aléatoire
 */
export function generateRandomColor() {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
    '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
    '#FC427B', '#1DD1A1', '#F79F1F', '#A3CB38', '#C44569'
  ]
  
  return colors[Math.floor(Math.random() * colors.length)]
}

/**
 * Obtient les initiales d'un nom
 */
export function getInitials(name) {
  if (!name) return ''
  
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substr(0, 2)
}

/**
 * Vérifie si on est en mode développement
 */
export function isDevelopment() {
  return process.env.NODE_ENV === 'development'
}

/**
 * Vérifie si on est en mode production
 */
export function isProduction() {
  return process.env.NODE_ENV === 'production'
}

/**
 * Crée un délai d'attente
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Groupe un tableau par une propriété
 */
export function groupBy(array, key) {
  return array.reduce((groups, item) => {
    const group = item[key]
    if (!groups[group]) {
      groups[group] = []
    }
    groups[group].push(item)
    return groups
  }, {})
}

/**
 * Supprime les doublons d'un tableau
 */
export function uniqueBy(array, key) {
  const seen = new Set()
  return array.filter(item => {
    const value = typeof key === 'function' ? key(item) : item[key]
    if (seen.has(value)) {
      return false
    }
    seen.add(value)
    return true
  })
}

export default {
  formatCurrency,
  convertCurrency,
  formatDate,
  timeAgo,
  validateEmail,
  validatePhoneCD,
  validatePassword,
  validateUrl,
  generateSlug,
  generateId,
  truncateText,
  capitalizeWords,
  formatPhoneNumber,
  calculatePercentage,
  formatNumber,
  debounce,
  throttle,
  copyToClipboard,
  downloadFile,
  getDeviceType,
  generateRandomColor,
  getInitials,
  isDevelopment,
  isProduction,
  sleep,
  groupBy,
  uniqueBy
}
