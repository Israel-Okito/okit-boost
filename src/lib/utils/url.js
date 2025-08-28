/**
 * Utilitaire pour générer les URLs correctes selon l'environnement
 * Inspiré de la documentation Supabase pour les redirect URLs
 * @see https://supabase.com/docs/guides/auth/redirect-urls
 */

/**
 * Génère l'URL de base de l'application selon l'environnement
 * @returns {string} L'URL de base complète avec https:// et trailing slash
 */
export function getURL() {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    'http://localhost:3000/' // Fallback for local development

  // Make sure to include `https://` when not localhost.
  url = url.startsWith('http') ? url : `https://${url}`
  
  // Make sure to include a trailing `/`.
  url = url.endsWith('/') ? url : `${url}/`
  
  return url
}

/**
 * Génère l'URL complète pour un chemin donné
 * @param {string} path - Le chemin relatif (ex: '/auth/callback')
 * @returns {string} L'URL complète
 */
export function getFullURL(path = '') {
  const baseURL = getURL()
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `${baseURL}${cleanPath}`
}

/**
 * Génère l'URL de redirection pour l'authentification
 * @param {string} callbackPath - Le chemin de callback (default: '/auth/callback')
 * @returns {string} L'URL de redirection complète
 */
export function getAuthRedirectURL(callbackPath = '/auth/callback') {
  // En développement, toujours utiliser localhost
  if (process.env.NODE_ENV === 'development') {
    return `http://localhost:3000${callbackPath}`
  }
  
  // En production, utiliser l'URL complète
  return getFullURL(callbackPath)
}

/**
 * Configuration des URLs de redirection pour Supabase selon l'environnement
 * @returns {Array<string>} Liste des URLs autorisées
 */
export function getAllowedRedirectURLs() {
  const baseURL = getURL()
  const urls = [baseURL]

  // En développement, ajouter localhost
  if (process.env.NODE_ENV === 'development') {
    urls.push(
      'http://localhost:3000/',
      'http://localhost:3000/**',
      'http://127.0.0.1:3000/',
      'http://127.0.0.1:3000/**'
    )
  }

  // Si on utilise Vercel, ajouter les URLs de preview
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    const vercelDomain = process.env.NEXT_PUBLIC_VERCEL_URL
    urls.push(
      `https://${vercelDomain}/`,
      `https://${vercelDomain}/**`,
      `https://*-${process.env.VERCEL_GIT_REPO_OWNER || 'okit-boost'}.vercel.app/**`
    )
  }

  // Si on utilise Netlify, ajouter les URLs de preview
  if (process.env.NETLIFY) {
    urls.push(
      `https://**--${process.env.NETLIFY_SITE_NAME || 'okit-boost'}.netlify.app/**`
    )
  }

  return urls
}

/**
 * Vérifie si une URL est autorisée pour les redirections
 * @param {string} url - L'URL à vérifier
 * @returns {boolean} True si l'URL est autorisée
 */
export function isAllowedRedirectURL(url) {
  const allowedURLs = getAllowedRedirectURLs()
  
  return allowedURLs.some(allowedURL => {
    // Gestion des wildcards
    if (allowedURL.includes('*')) {
      const regex = new RegExp(
        allowedURL
          .replace(/\*\*/g, '.*') // ** matches any sequence of characters
          .replace(/\*/g, '[^/.]*') // * matches any sequence of non-separator characters
          .replace(/\?/g, '[^/.]') // ? matches any single non-separator character
      )
      return regex.test(url)
    }
    
    return url === allowedURL || url.startsWith(allowedURL)
  })
}

/**
 * Obtient l'environnement actuel
 * @returns {string} 'development', 'preview', ou 'production'
 */
export function getEnvironment() {
  if (process.env.NODE_ENV === 'development') {
    return 'development'
  }
  
  if (process.env.VERCEL_ENV === 'preview' || process.env.NETLIFY_CONTEXT === 'deploy-preview') {
    return 'preview'
  }
  
  return 'production'
}

/**
 * Configuration spécifique pour CinetPay selon l'environnement
 * @returns {Object} Configuration CinetPay
 */
export function getCinetPayConfig() {
  const environment = getEnvironment()
  
  return {
    // URLs de notification et de retour
    notifyUrl: getFullURL('api/webhooks/cinetpay'),
    returnUrl: getFullURL('paiement/success'),
    cancelUrl: getFullURL('paiement/cancel'),
    
    // Mode sandbox en développement
    sandbox: environment === 'development',
    
    // Site ID selon l'environnement
    siteId: environment === 'production' 
      ? process.env.CINETPAY_SITE_ID 
      : process.env.CINETPAY_SITE_ID_SANDBOX || process.env.CINETPAY_SITE_ID,
      
    // API Key selon l'environnement  
    apiKey: environment === 'production'
      ? process.env.CINETPAY_API_KEY
      : process.env.CINETPAY_API_KEY_SANDBOX || process.env.CINETPAY_API_KEY
  }
}

export default {
  getURL,
  getFullURL,
  getAuthRedirectURL,
  getAllowedRedirectURLs,
  isAllowedRedirectURL,
  getEnvironment,
  getCinetPayConfig
}
