/**
 * Constantes globales de l'application
 */

// États des commandes
export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  FAILED: 'failed'
}

// États de paiement
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
}

// Providers de paiement
export const PAYMENT_PROVIDERS = {
  CINETPAY: 'cinetpay',
  MANUAL: 'manual'
}

// Méthodes de paiement CinetPay
export const CINETPAY_METHODS = {
  ORANGE_MONEY: 'ORANGE_MONEY_CD',
  MPESA: 'MPESA',
  AIRTEL_MONEY: 'AIRTEL_MONEY_CD'
}

// Devises supportées
export const CURRENCIES = {
  USD: 'USD',
  CDF: 'CDF'
}

// Rôles utilisateur
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  MODERATOR: 'moderator'
}

// Plateformes de services
export const PLATFORMS = {
  TIKTOK: 'tiktok',
  INSTAGRAM: 'instagram',
  YOUTUBE: 'youtube',
  FACEBOOK: 'facebook',
  TWITTER: 'twitter',
  TELEGRAM: 'telegram'
}

// Types de services
export const SERVICE_TYPES = {
  FOLLOWERS: 'followers',
  LIKES: 'likes',
  VIEWS: 'views',
  COMMENTS: 'comments',
  SHARES: 'shares',
  SUBSCRIBERS: 'subscribers'
}

// Qualité des services
export const SERVICE_QUALITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
}

// Vitesse de livraison
export const DELIVERY_SPEED = {
  INSTANT: 'instant',
  FAST: 'fast',
  NORMAL: 'normal',
  SLOW: 'slow'
}

// Limites par défaut
export const DEFAULT_LIMITS = {
  MIN_QUANTITY: 100,
  MAX_QUANTITY: 100000,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_UPLOAD_FILES: 5
}

// Messages d'erreur fréquents
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Vous devez être connecté pour effectuer cette action',
  FORBIDDEN: 'Vous n\'avez pas les permissions nécessaires',
  NOT_FOUND: 'Ressource non trouvée',
  VALIDATION_ERROR: 'Données invalides',
  PAYMENT_FAILED: 'Le paiement a échoué',
  SERVICE_UNAVAILABLE: 'Service temporairement indisponible',
  NETWORK_ERROR: 'Erreur de connexion réseau',
  INTERNAL_ERROR: 'Erreur interne du serveur'
}

// Messages de succès
export const SUCCESS_MESSAGES = {
  ORDER_CREATED: 'Commande créée avec succès',
  PAYMENT_SUCCESS: 'Paiement effectué avec succès',
  PROFILE_UPDATED: 'Profil mis à jour avec succès',
  PASSWORD_UPDATED: 'Mot de passe modifié avec succès',
  EMAIL_SENT: 'Email envoyé avec succès'
}

// Configuration par défaut
export const DEFAULT_CONFIG = {
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100
  },
  CACHE: {
    DEFAULT_TTL: 300, // 5 minutes
    LONG_TTL: 3600,   // 1 heure
    SHORT_TTL: 60     // 1 minute
  },
  RETRY: {
    MAX_ATTEMPTS: 3,
    BASE_DELAY: 1000,
    MAX_DELAY: 10000
  }
}

// Expressions régulières communes
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_CD: /^(\+243|0)[0-9]{9}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/
}

// Formats de date
export const DATE_FORMATS = {
  SHORT: 'dd/MM/yyyy',
  LONG: 'dd MMMM yyyy',
  DATETIME: 'dd/MM/yyyy HH:mm',
  TIME: 'HH:mm',
  ISO: 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx'
}

// Couleurs d'état
export const STATUS_COLORS = {
  [ORDER_STATUS.PENDING]: 'yellow',
  [ORDER_STATUS.PROCESSING]: 'blue',
  [ORDER_STATUS.COMPLETED]: 'green',
  [ORDER_STATUS.CANCELLED]: 'red',
  [ORDER_STATUS.FAILED]: 'red',
  
  [PAYMENT_STATUS.PENDING]: 'yellow',
  [PAYMENT_STATUS.PAID]: 'green',
  [PAYMENT_STATUS.FAILED]: 'red',
  [PAYMENT_STATUS.CANCELLED]: 'gray',
  [PAYMENT_STATUS.REFUNDED]: 'orange'
}

// Icônes d'état (Lucide React)
export const STATUS_ICONS = {
  [ORDER_STATUS.PENDING]: 'Clock',
  [ORDER_STATUS.PROCESSING]: 'Package',
  [ORDER_STATUS.COMPLETED]: 'CheckCircle',
  [ORDER_STATUS.CANCELLED]: 'XCircle',
  [ORDER_STATUS.FAILED]: 'AlertCircle',
  
  [PAYMENT_STATUS.PENDING]: 'Clock',
  [PAYMENT_STATUS.PAID]: 'CheckCircle',
  [PAYMENT_STATUS.FAILED]: 'XCircle',
  [PAYMENT_STATUS.CANCELLED]: 'XCircle',
  [PAYMENT_STATUS.REFUNDED]: 'RotateCcw'
}

// Labels d'affichage
export const STATUS_LABELS = {
  [ORDER_STATUS.PENDING]: 'En attente',
  [ORDER_STATUS.PROCESSING]: 'En cours',
  [ORDER_STATUS.COMPLETED]: 'Terminé',
  [ORDER_STATUS.CANCELLED]: 'Annulé',
  [ORDER_STATUS.FAILED]: 'Échoué',
  
  [PAYMENT_STATUS.PENDING]: 'En attente',
  [PAYMENT_STATUS.PAID]: 'Payé',
  [PAYMENT_STATUS.FAILED]: 'Échoué',
  [PAYMENT_STATUS.CANCELLED]: 'Annulé',
  [PAYMENT_STATUS.REFUNDED]: 'Remboursé',
  
  [USER_ROLES.USER]: 'Utilisateur',
  [USER_ROLES.ADMIN]: 'Administrateur',
  [USER_ROLES.MODERATOR]: 'Modérateur'
}

// Configuration des notifications
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
}

// Durées des notifications
export const NOTIFICATION_DURATION = {
  SHORT: 3000,
  MEDIUM: 5000,
  LONG: 8000,
  PERSISTENT: 0
}

const constants = {
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_PROVIDERS,
  CINETPAY_METHODS,
  CURRENCIES,
  USER_ROLES,
  PLATFORMS,
  SERVICE_TYPES,
  SERVICE_QUALITY,
  DELIVERY_SPEED,
  DEFAULT_LIMITS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  DEFAULT_CONFIG,
  REGEX,
  DATE_FORMATS,
  STATUS_COLORS,
  STATUS_ICONS,
  STATUS_LABELS,
  NOTIFICATION_TYPES,
  NOTIFICATION_DURATION
}

export default constants
