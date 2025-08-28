/**
 * Configuration du logging
 * Permet de désactiver les logs de debug en production
 */

export const LOG_CONFIG = {
  // Niveaux de log (ordre d'importance)
  LEVELS: {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
  },
  
  // Niveau actuel (en production, mettre à INFO ou WARN)
  CURRENT_LEVEL: process.env.NODE_ENV === 'production' ? 1 : 2, // WARN en prod, INFO en dev
  
  // Modules à désactiver complètement
  DISABLED_MODULES: [
    'circuit-breaker',
    'retry-system',
    'performance-monitor'
  ],
  
  // Limiter les logs de sécurité en production
  SECURITY_LOGS_ENABLED: process.env.NODE_ENV !== 'production'
}

/**
 * Vérifie si un niveau de log doit être affiché
 */
export function shouldLog(level) {
  const levelValue = LOG_CONFIG.LEVELS[level.toUpperCase()]
  return levelValue <= LOG_CONFIG.CURRENT_LEVEL
}

/**
 * Vérifie si un module de logging est activé
 */
export function isModuleEnabled(moduleName) {
  return !LOG_CONFIG.DISABLED_MODULES.includes(moduleName)
}

/**
 * Logger optimisé pour la production
 */
export const productionLogger = {
  error: (message, meta = {}) => {
    if (shouldLog('ERROR')) {
      console.error(`[ERROR] ${message}`, meta)
    }
  },
  
  warn: (message, meta = {}) => {
    if (shouldLog('WARN')) {
      console.warn(`[WARN] ${message}`, meta)
    }
  },
  
  info: (message, meta = {}) => {
    if (shouldLog('INFO')) {
      console.log(`[INFO] ${message}`, meta)
    }
  },
  
  debug: (message, meta = {}) => {
    // Debug complètement désactivé pour optimiser les performances
    // if (shouldLog('DEBUG')) {
    //   console.log(`[DEBUG] ${message}`, meta)
    // }
  },
  
  security: (message, meta = {}) => {
    if (LOG_CONFIG.SECURITY_LOGS_ENABLED) {
      console.log(`[SECURITY] ${message}`, meta)
    }
  }
}
