export const ORDER_STATUSES = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded'
  }
  
  export const PAYMENT_METHODS = {
    ORANGE: 'orange',
    AIRTEL: 'airtel',
    MPESA: 'mpesa',
    AFRIMONEY: 'afrimoney'
  }
  
  export const TRIAL_STATUSES = {
    PENDING: 'pending',
    APPROVED: 'approved',
    DELIVERED: 'delivered',
    REJECTED: 'rejected'
  }
  
  export const USER_ROLES = {
    USER: 'user',
    ADMIN: 'admin'
  }
  
  export const PLATFORMS = {
    TIKTOK: 'tiktok',
    INSTAGRAM: 'instagram',
    YOUTUBE: 'youtube',
    FACEBOOK: 'facebook'
  }
  
  export const SERVICE_CATEGORIES = {
    FOLLOWERS: 'followers',
    LIKES: 'likes',
    VIEWS: 'views',
    SUBSCRIBERS: 'subscribers',
    COMMENTS: 'comments',
    SHARES: 'shares'
  }
  
  // Configuration des limites
  export const LIMITS = {
    FILE_SIZE_MAX: 5 * 1024 * 1024, // 5MB
    ORDER_ITEMS_MAX: 10,
    TRIAL_REQUESTS_PER_DAY: 1,
    ORDERS_PER_PAGE: 20
  }
  
  // Configuration des devises
  export const CURRENCIES = {
    USD: {
      code: 'USD',
      symbol: '$',
      name: 'Dollar américain'
    },
    CDF: {
      code: 'CDF',
      symbol: 'FC',
      name: 'Franc congolais'
    }
  }
  
  // Taux de change (à mettre à jour régulièrement)
  export const EXCHANGE_RATES = {
    USD_TO_CDF: 2500, // 1 USD = 2500 CDF (exemple)
    CDF_TO_USD: 0.0004 // 1 CDF = 0.0004 USD
  }