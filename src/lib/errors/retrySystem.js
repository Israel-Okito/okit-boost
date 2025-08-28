/**
 * Système de retry intelligent avec backoff adaptatif
 * Optimise automatiquement les stratégies de retry selon les conditions
 */

import { errorHandler, ERROR_TYPES } from './errorHandler.js';
import { logger } from './logger.js';
import { circuitBreakerManager } from './circuitBreaker.js';

// Stratégies de backoff
export const BACKOFF_STRATEGIES = {
  LINEAR: 'linear',
  EXPONENTIAL: 'exponential',
  FIBONACCI: 'fibonacci',
  ADAPTIVE: 'adaptive',
  FIXED: 'fixed'
};

// Conditions de retry
export const RETRY_CONDITIONS = {
  ALWAYS: 'always',
  ON_ERROR_TYPE: 'on_error_type',
  ON_STATUS_CODE: 'on_status_code',
  ON_CONDITION: 'on_condition',
  NEVER: 'never'
};

// Configuration par défaut
const DEFAULT_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  strategy: BACKOFF_STRATEGIES.EXPONENTIAL,
  condition: RETRY_CONDITIONS.ALWAYS,
  jitter: true,
  jitterFactor: 0.1,
  multiplier: 2,
  circuitBreaker: false,
  adaptiveFactors: {
    successRate: 0.8,    // Seuil de succès pour réduire les délais
    failureRate: 0.5,    // Seuil d'échec pour augmenter les délais
    responseTime: 5000   // Seuil de temps de réponse lent
  }
};

/**
 * Classe principale du système de retry
 */
export class RetrySystem {
  constructor(name, config = {}) {
    this.name = name;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.history = [];
    this.adaptiveState = {
      recentAttempts: [],
      avgResponseTime: 0,
      successRate: 1,
      adaptiveFactor: 1
    };
    
    // Circuit breaker si activé
    this.circuitBreaker = this.config.circuitBreaker ? 
      circuitBreakerManager.getCircuit(`retry_${name}`) : null;
  }

  /**
   * Exécute une opération avec retry
   */
  async execute(operation, context = {}) {
    const attemptId = this.generateAttemptId();
    const startTime = Date.now();
    
    let lastError;
    let attempts = 0;

    // Log du début - désactivé pour performance
    // await logger.debug(`Retry operation started: ${this.name}`, {
    //   attemptId,
    //   maxAttempts: this.config.maxAttempts,
    //   strategy: this.config.strategy
    // });

    for (attempts = 1; attempts <= this.config.maxAttempts; attempts++) {
      try {
        const attemptStart = Date.now();
        
        // Utiliser circuit breaker si disponible
        const result = this.circuitBreaker ?
          await this.circuitBreaker.execute(operation) :
          await operation();
        
        const responseTime = Date.now() - attemptStart;
        
        // Enregistrer le succès
        this.recordAttempt(attemptId, attempts, true, responseTime, null);
        
        // Mise à jour adaptative
        this.updateAdaptiveState(true, responseTime);
        
        // Log du succès - désactivé pour performance
        // const totalTime = Date.now() - startTime;
        // await logger.info(`Retry operation succeeded: ${this.name}`, {
        //   attemptId,
        //   attempts,
        //   totalTime,
        //   responseTime,
        //   successAfterRetry: attempts > 1
        // });

        return result;
        
      } catch (error) {
        lastError = error;
        const responseTime = Date.now() - attemptStart;
        
        // Vérifier si on doit retry
        if (!this.shouldRetry(error, attempts)) {
          await logger.warn(`Retry condition not met: ${this.name}`, {
            attemptId,
            attempts,
            error: error.message,
            condition: this.config.condition
          });
          break;
        }

        // Enregistrer l'échec
        this.recordAttempt(attemptId, attempts, false, responseTime, error);
        
        // Mise à jour adaptative
        this.updateAdaptiveState(false, responseTime);

        // Log de l'échec
        await logger.warn(`Retry attempt failed: ${this.name}`, {
          attemptId,
          attempt: attempts,
          maxAttempts: this.config.maxAttempts,
          error: error.message,
          responseTime
        });

        // Si ce n'est pas la dernière tentative, attendre
        if (attempts < this.config.maxAttempts) {
          const delay = this.calculateDelay(attempts, error);
          
          await logger.debug(`Retry delay: ${this.name}`, {
            attemptId,
            attempt: attempts,
            delay,
            strategy: this.config.strategy
          });
          
          await this.sleep(delay);
        }
      }
    }

    // Toutes les tentatives ont échoué
    const totalTime = Date.now() - startTime;
    
    await logger.error(`Retry operation failed permanently: ${this.name}`, {
      attemptId,
      totalAttempts: attempts - 1,
      totalTime,
      finalError: lastError.message,
      stack: lastError.stack
    });

    throw new Error(
      `Operation failed after ${attempts - 1} attempts: ${lastError.message}`
    );
  }

  /**
   * Vérifie si on doit retry
   */
  shouldRetry(error, attempt) {
    // Ne pas retry si on a atteint le maximum
    if (attempt >= this.config.maxAttempts) {
      return false;
    }

    switch (this.config.condition) {
      case RETRY_CONDITIONS.NEVER:
        return false;
        
      case RETRY_CONDITIONS.ALWAYS:
        return true;
        
      case RETRY_CONDITIONS.ON_ERROR_TYPE:
        return this.config.retryableErrorTypes?.includes(
          errorHandler.classifyError(error)
        ) || false;
        
      case RETRY_CONDITIONS.ON_STATUS_CODE:
        return this.config.retryableStatusCodes?.includes(error.status) || false;
        
      case RETRY_CONDITIONS.ON_CONDITION:
        return this.config.retryCondition ? 
          this.config.retryCondition(error, attempt) : false;
        
      default:
        return false;
    }
  }

  /**
   * Calcule le délai selon la stratégie
   */
  calculateDelay(attempt, error = null) {
    let delay;
    
    switch (this.config.strategy) {
      case BACKOFF_STRATEGIES.FIXED:
        delay = this.config.baseDelay;
        break;
        
      case BACKOFF_STRATEGIES.LINEAR:
        delay = this.config.baseDelay * attempt;
        break;
        
      case BACKOFF_STRATEGIES.EXPONENTIAL:
        delay = this.config.baseDelay * Math.pow(this.config.multiplier, attempt - 1);
        break;
        
      case BACKOFF_STRATEGIES.FIBONACCI:
        delay = this.config.baseDelay * this.fibonacci(attempt);
        break;
        
      case BACKOFF_STRATEGIES.ADAPTIVE:
        delay = this.calculateAdaptiveDelay(attempt, error);
        break;
        
      default:
        delay = this.config.baseDelay * Math.pow(2, attempt - 1);
    }

    // Appliquer les limites
    delay = Math.min(delay, this.config.maxDelay);
    delay = Math.max(delay, 100); // Minimum 100ms
    
    // Appliquer le jitter si activé
    if (this.config.jitter) {
      const jitterAmount = delay * this.config.jitterFactor;
      const jitterOffset = (Math.random() - 0.5) * 2 * jitterAmount;
      delay += jitterOffset;
    }

    return Math.round(delay);
  }

  /**
   * Calcule le délai adaptatif
   */
  calculateAdaptiveDelay(attempt, error) {
    const baseDelay = this.config.baseDelay * Math.pow(2, attempt - 1);
    let adaptiveFactor = this.adaptiveState.adaptiveFactor;
    
    // Ajuster selon le taux de succès récent
    if (this.adaptiveState.successRate < this.config.adaptiveFactors.successRate) {
      adaptiveFactor *= 1.5; // Augmenter le délai si taux de succès faible
    } else if (this.adaptiveState.successRate > 0.9) {
      adaptiveFactor *= 0.8; // Réduire le délai si taux de succès élevé
    }
    
    // Ajuster selon le temps de réponse moyen
    if (this.adaptiveState.avgResponseTime > this.config.adaptiveFactors.responseTime) {
      adaptiveFactor *= 1.3; // Augmenter si réponses lentes
    }
    
    // Ajuster selon le type d'erreur
    if (error) {
      const errorType = errorHandler.classifyError(error);
      switch (errorType) {
        case ERROR_TYPES.RATE_LIMIT:
          adaptiveFactor *= 2; // Doubler pour rate limiting
          break;
        case ERROR_TYPES.NETWORK:
          adaptiveFactor *= 1.5; // Augmenter pour erreurs réseau
          break;
        case ERROR_TYPES.SYSTEM:
          adaptiveFactor *= 1.8; // Augmenter pour erreurs système
          break;
      }
    }
    
    // Limiter le facteur adaptatif
    adaptiveFactor = Math.max(0.1, Math.min(10, adaptiveFactor));
    this.adaptiveState.adaptiveFactor = adaptiveFactor;
    
    return Math.round(baseDelay * adaptiveFactor);
  }

  /**
   * Calcule le nombre de Fibonacci
   */
  fibonacci(n) {
    if (n <= 1) return 1;
    let a = 1, b = 1;
    for (let i = 2; i < n; i++) {
      [a, b] = [b, a + b];
    }
    return b;
  }

  /**
   * Met à jour l'état adaptatif
   */
  updateAdaptiveState(success, responseTime) {
    const now = Date.now();
    
    // Ajouter la tentative récente
    this.adaptiveState.recentAttempts.push({
      timestamp: now,
      success,
      responseTime
    });
    
    // Garder seulement les 50 dernières tentatives
    if (this.adaptiveState.recentAttempts.length > 50) {
      this.adaptiveState.recentAttempts.shift();
    }
    
    // Calculer les métriques
    const recent = this.adaptiveState.recentAttempts;
    if (recent.length > 0) {
      const successes = recent.filter(a => a.success).length;
      this.adaptiveState.successRate = successes / recent.length;
      
      const avgResponseTime = recent.reduce((sum, a) => sum + a.responseTime, 0) / recent.length;
      this.adaptiveState.avgResponseTime = avgResponseTime;
    }
  }

  /**
   * Enregistre une tentative
   */
  recordAttempt(attemptId, attemptNumber, success, responseTime, error) {
    const attempt = {
      id: attemptId,
      attempt: attemptNumber,
      timestamp: new Date().toISOString(),
      success,
      responseTime,
      error: error ? {
        message: error.message,
        type: errorHandler.classifyError(error),
        stack: error.stack
      } : null
    };
    
    this.history.push(attempt);
    
    // Garder seulement les 100 dernières tentatives
    if (this.history.length > 100) {
      this.history.shift();
    }
  }

  /**
   * Génère un ID unique pour la tentative
   */
  generateAttemptId() {
    return `${this.name}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  }

  /**
   * Utilitaire pour le délai
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtient les statistiques
   */
  getStatistics() {
    const recent = this.history.slice(-20); // 20 dernières tentatives
    
    if (recent.length === 0) {
      return {
        totalAttempts: 0,
        successRate: 0,
        averageResponseTime: 0,
        averageRetries: 0,
        adaptiveState: this.adaptiveState
      };
    }
    
    const successes = recent.filter(a => a.success).length;
    const avgResponseTime = recent.reduce((sum, a) => sum + a.responseTime, 0) / recent.length;
    
    // Calculer le nombre moyen de retries par opération
    const operations = {};
    recent.forEach(attempt => {
      const baseId = attempt.id.split('_').slice(0, -2).join('_');
      if (!operations[baseId]) {
        operations[baseId] = 0;
      }
      operations[baseId]++;
    });
    
    const avgRetries = Object.values(operations).reduce((sum, count) => sum + (count - 1), 0) / 
                      Object.keys(operations).length;
    
    return {
      totalAttempts: recent.length,
      successRate: successes / recent.length,
      averageResponseTime: avgResponseTime,
      averageRetries: avgRetries || 0,
      adaptiveState: this.adaptiveState,
      config: this.config
    };
  }

  /**
   * Réinitialise les statistiques
   */
  resetStatistics() {
    this.history = [];
    this.adaptiveState = {
      recentAttempts: [],
      avgResponseTime: 0,
      successRate: 1,
      adaptiveFactor: 1
    };
    
    logger.info(`Retry statistics reset: ${this.name}`);
  }

  /**
   * Met à jour la configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    logger.info(`Retry configuration updated: ${this.name}`, {
      newConfig: this.config
    });
  }
}

/**
 * Gestionnaire global des systèmes de retry
 */
export class RetryManager {
  constructor() {
    this.retryHandlers = new Map();
  }

  /**
   * Crée ou récupère un gestionnaire de retry
   */
  getHandler(name, config = {}) {
    if (!this.retryHandlers.has(name)) {
      this.retryHandlers.set(name, new RetrySystem(name, config));
    }
    return this.retryHandlers.get(name);
  }

  /**
   * Exécute une opération avec retry
   */
  async execute(handlerName, operation, config = {}, context = {}) {
    const handler = this.getHandler(handlerName, config);
    return await handler.execute(operation, context);
  }

  /**
   * Obtient les statistiques de tous les handlers
   */
  getAllStatistics() {
    const stats = {};
    for (const [name, handler] of this.retryHandlers) {
      stats[name] = handler.getStatistics();
    }
    return stats;
  }

  /**
   * Réinitialise toutes les statistiques
   */
  resetAllStatistics() {
    for (const handler of this.retryHandlers.values()) {
      handler.resetStatistics();
    }
    logger.info('All retry statistics reset');
  }
}

// Instance globale
export const retryManager = new RetryManager();

// Configurations prédéfinies
export const RETRY_CONFIGS = {
  payment: {
    maxAttempts: 3,
    strategy: BACKOFF_STRATEGIES.EXPONENTIAL,
    baseDelay: 2000,
    maxDelay: 30000,
    condition: RETRY_CONDITIONS.ON_ERROR_TYPE,
    retryableErrorTypes: [ERROR_TYPES.NETWORK, ERROR_TYPES.EXTERNAL_API],
    circuitBreaker: true
  },
  
  database: {
    maxAttempts: 5,
    strategy: BACKOFF_STRATEGIES.ADAPTIVE,
    baseDelay: 500,
    maxDelay: 10000,
    condition: RETRY_CONDITIONS.ON_ERROR_TYPE,
    retryableErrorTypes: [ERROR_TYPES.DATABASE, ERROR_TYPES.NETWORK],
    circuitBreaker: true
  },
  
  api: {
    maxAttempts: 3,
    strategy: BACKOFF_STRATEGIES.EXPONENTIAL,
    baseDelay: 1000,
    maxDelay: 15000,
    condition: RETRY_CONDITIONS.ON_STATUS_CODE,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    circuitBreaker: false
  },
  
  notification: {
    maxAttempts: 5,
    strategy: BACKOFF_STRATEGIES.FIBONACCI,
    baseDelay: 1000,
    maxDelay: 60000,
    condition: RETRY_CONDITIONS.ALWAYS,
    circuitBreaker: false
  }
};

// Fonction helper pour créer des handlers prédéfinis
export function createRetryHandler(name, type = 'default', customConfig = {}) {
  const baseConfig = RETRY_CONFIGS[type] || {};
  const config = { ...baseConfig, ...customConfig };
  return retryManager.getHandler(name, config);
}

// Décorateur pour les fonctions
export function withRetry(name, config = {}) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      const handler = retryManager.getHandler(`${name}_${propertyKey}`, config);
      return await handler.execute(() => originalMethod.apply(this, args));
    };
    
    return descriptor;
  };
}

export default retryManager;
