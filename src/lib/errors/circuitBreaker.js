/**
 * Circuit Breaker Pattern Implementation
 * Prévient les pannes en cascade et améliore la résilience
 */

import { errorHandler } from './errorHandler.js';
import { logger } from './logger.js';

// États du circuit breaker
export const CIRCUIT_STATES = {
  CLOSED: 'CLOSED',       // Normal, laisse passer les requêtes
  OPEN: 'OPEN',           // Bloque les requêtes, service considéré comme défaillant
  HALF_OPEN: 'HALF_OPEN'  // Test si le service est rétabli
};

// Configuration par défaut
const DEFAULT_CONFIG = {
  failureThreshold: 5,        // Nombre d'échecs avant ouverture
  recoveryTimeout: 60000,     // Temps avant test de récupération (ms)
  monitoringPeriod: 60000,    // Période de monitoring (ms)
  expectedErrors: [],         // Types d'erreurs attendues (ne comptent pas comme échecs)
  slowCallThreshold: 5000,    // Seuil pour appels lents (ms)
  slowCallDurationThreshold: 10000, // Durée max pour appels lents
  minimumThroughput: 10,      // Minimum d'appels avant évaluation
  halfOpenMaxCalls: 3         // Nombre max d'appels en half-open
};

/**
 * Classe Circuit Breaker
 */
export class CircuitBreaker {
  constructor(name, config = {}) {
    this.name = name;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = CIRCUIT_STATES.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.totalCalls = 0;
    this.lastFailureTime = null;
    this.lastStateChange = Date.now();
    this.halfOpenCalls = 0;
    this.callTimings = [];
    
    // Métriques détaillées
    this.metrics = {
      totalCalls: 0,
      totalFailures: 0,
      totalSuccesses: 0,
      totalTimeouts: 0,
      totalSlowCalls: 0,
      averageResponseTime: 0,
      circuitOpenedCount: 0,
      lastFailure: null,
      uptime: Date.now()
    };

    // Démarrer le monitoring
    this.startMonitoring();
    
    logger.info(`Circuit breaker created: ${this.name}`, {
      config: this.config,
      initialState: this.state
    });
  }

  /**
   * Exécute une opération avec protection circuit breaker
   */
  async execute(operation, fallback = null) {
    const startTime = Date.now();
    const callId = this.generateCallId();
    
    // Vérifier l'état du circuit
    if (this.state === CIRCUIT_STATES.OPEN) {
      if (this.shouldAttemptReset()) {
        this.transitionToHalfOpen();
      } else {
        return this.handleCircuitOpen(fallback, callId);
      }
    }

    // Limiter les appels en half-open
    if (this.state === CIRCUIT_STATES.HALF_OPEN) {
      if (this.halfOpenCalls >= this.config.halfOpenMaxCalls) {
        return this.handleCircuitOpen(fallback, callId);
      }
      this.halfOpenCalls++;
    }

    this.totalCalls++;
    this.metrics.totalCalls++;

    try {
      // Ajouter timeout si configuré
      const operationWithTimeout = this.config.timeout 
        ? this.withTimeout(operation, this.config.timeout)
        : operation;

      const result = await operationWithTimeout();
      
      // Calculer le temps de réponse
      const responseTime = Date.now() - startTime;
      this.recordResponseTime(responseTime);
      
      // Vérifier si l'appel est lent
      if (responseTime > this.config.slowCallThreshold) {
        this.metrics.totalSlowCalls++;
        await logger.warn(`Slow call detected in circuit ${this.name}`, {
          callId,
          responseTime,
          threshold: this.config.slowCallThreshold
        });
      }

      // Enregistrer le succès
      this.recordSuccess(callId, responseTime);
      
      return result;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Vérifier si c'est une erreur attendue
      if (this.isExpectedError(error)) {
        await logger.debug(`Expected error in circuit ${this.name}`, {
          callId,
          error: error.message,
          responseTime
        });
        this.recordResponseTime(responseTime);
        throw error;
      }

      // Enregistrer l'échec
      this.recordFailure(error, callId, responseTime);
      
      // Utiliser le fallback si disponible
      if (fallback) {
        await logger.info(`Using fallback for circuit ${this.name}`, {
          callId,
          error: error.message
        });
        return await fallback(error);
      }
      
      throw error;
    }
  }

  /**
   * Vérifie si le circuit doit tenter de se réinitialiser
   */
  shouldAttemptReset() {
    return this.lastFailureTime && 
           (Date.now() - this.lastFailureTime) >= this.config.recoveryTimeout;
  }

  /**
   * Transition vers l'état HALF_OPEN
   */
  transitionToHalfOpen() {
    this.state = CIRCUIT_STATES.HALF_OPEN;
    this.halfOpenCalls = 0;
    this.lastStateChange = Date.now();
    
    logger.info(`Circuit breaker transitioning to HALF_OPEN: ${this.name}`, {
      previousState: CIRCUIT_STATES.OPEN,
      timeSinceLastFailure: Date.now() - this.lastFailureTime
    });
  }

  /**
   * Gère l'état circuit ouvert
   */
  async handleCircuitOpen(fallback, callId) {
    await logger.warn(`Circuit breaker OPEN - request blocked: ${this.name}`, {
      callId,
      failures: this.failures,
      threshold: this.config.failureThreshold
    });

    if (fallback) {
      return await fallback(new Error('Circuit breaker is open'));
    }

    throw new Error(`Circuit breaker is open for ${this.name}`);
  }

  /**
   * Enregistre un succès
   */
  recordSuccess(callId, responseTime) {
    this.successes++;
    this.metrics.totalSuccesses++;
    
    if (this.state === CIRCUIT_STATES.HALF_OPEN) {
      // Tous les appels en half-open ont réussi, fermer le circuit
      if (this.halfOpenCalls >= this.config.halfOpenMaxCalls) {
        this.transitionToClosed();
      }
    }

    logger.debug(`Circuit breaker success: ${this.name}`, {
      callId,
      responseTime,
      state: this.state,
      successes: this.successes
    });
  }

  /**
   * Enregistre un échec
   */
  async recordFailure(error, callId, responseTime) {
    this.failures++;
    this.metrics.totalFailures++;
    this.lastFailureTime = Date.now();
    this.metrics.lastFailure = {
      timestamp: this.lastFailureTime,
      error: error.message,
      callId
    };

    await logger.error(`Circuit breaker failure: ${this.name}`, {
      callId,
      error: error.message,
      responseTime,
      failures: this.failures,
      threshold: this.config.failureThreshold,
      state: this.state
    });

    // Vérifier si on doit ouvrir le circuit
    if (this.shouldOpenCircuit()) {
      this.transitionToOpen();
    }
  }

  /**
   * Vérifie si le circuit doit s'ouvrir
   */
  shouldOpenCircuit() {
    // Vérifier le nombre minimum d'appels
    if (this.totalCalls < this.config.minimumThroughput) {
      return false;
    }

    // Vérifier le seuil d'échecs
    return this.failures >= this.config.failureThreshold ||
           (this.totalCalls > 0 && (this.failures / this.totalCalls) > 0.5);
  }

  /**
   * Transition vers l'état OPEN
   */
  transitionToOpen() {
    const previousState = this.state;
    this.state = CIRCUIT_STATES.OPEN;
    this.lastStateChange = Date.now();
    this.metrics.circuitOpenedCount++;
    
    logger.error(`Circuit breaker OPENED: ${this.name}`, {
      previousState,
      failures: this.failures,
      totalCalls: this.totalCalls,
      failureRate: this.totalCalls > 0 ? (this.failures / this.totalCalls) : 0
    });
  }

  /**
   * Transition vers l'état CLOSED
   */
  transitionToClosed() {
    const previousState = this.state;
    this.state = CIRCUIT_STATES.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.halfOpenCalls = 0;
    this.lastStateChange = Date.now();
    
    logger.info(`Circuit breaker CLOSED: ${this.name}`, {
      previousState,
      timeSinceOpen: previousState === CIRCUIT_STATES.OPEN ? 
        Date.now() - this.lastStateChange : 0
    });
  }

  /**
   * Vérifie si une erreur est attendue
   */
  isExpectedError(error) {
    return this.config.expectedErrors.some(expectedError => {
      if (typeof expectedError === 'string') {
        return error.message.includes(expectedError);
      }
      if (expectedError instanceof RegExp) {
        return expectedError.test(error.message);
      }
      if (typeof expectedError === 'function') {
        return expectedError(error);
      }
      return false;
    });
  }

  /**
   * Ajoute un timeout à une opération
   */
  withTimeout(operation, timeout) {
    return () => Promise.race([
      operation(),
      new Promise((_, reject) => 
        setTimeout(() => {
          this.metrics.totalTimeouts++;
          reject(new Error(`Operation timeout after ${timeout}ms`));
        }, timeout)
      )
    ]);
  }

  /**
   * Enregistre le temps de réponse
   */
  recordResponseTime(responseTime) {
    this.callTimings.push(responseTime);
    
    // Garder seulement les 100 derniers timings
    if (this.callTimings.length > 100) {
      this.callTimings.shift();
    }
    
    // Calculer la moyenne
    this.metrics.averageResponseTime = 
      this.callTimings.reduce((sum, time) => sum + time, 0) / this.callTimings.length;
  }

  /**
   * Génère un ID unique pour l'appel
   */
  generateCallId() {
    return `${this.name}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  }

  /**
   * Démarre le monitoring périodique
   */
  startMonitoring() {
    setInterval(() => {
      this.collectMetrics();
      this.resetPeriodCounters();
    }, this.config.monitoringPeriod);
  }

  /**
   * Collecte les métriques
   */
  collectMetrics() {
    const now = Date.now();
    const uptime = now - this.metrics.uptime;
    
    const metrics = {
      ...this.metrics,
      state: this.state,
      uptime,
      currentFailures: this.failures,
      currentSuccesses: this.successes,
      currentTotalCalls: this.totalCalls,
      failureRate: this.totalCalls > 0 ? (this.failures / this.totalCalls) : 0,
      timeSinceLastStateChange: now - this.lastStateChange
    };

    logger.debug(`Circuit breaker metrics: ${this.name}`, metrics);
    
    // Alertes si nécessaire
    if (this.state === CIRCUIT_STATES.OPEN && 
        now - this.lastStateChange > this.config.recoveryTimeout * 2) {
      logger.warn(`Circuit breaker stuck OPEN: ${this.name}`, {
        timeSinceOpen: now - this.lastStateChange,
        recoveryTimeout: this.config.recoveryTimeout
      });
    }
  }

  /**
   * Remet à zéro les compteurs de période
   */
  resetPeriodCounters() {
    // Garder les métriques globales, reset seulement les compteurs de période
    if (this.state === CIRCUIT_STATES.CLOSED) {
      this.failures = 0;
      this.successes = 0;
      this.totalCalls = 0;
    }
  }

  /**
   * Obtient l'état actuel du circuit breaker
   */
  getState() {
    return {
      name: this.name,
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      totalCalls: this.totalCalls,
      metrics: this.metrics,
      config: this.config,
      lastStateChange: this.lastStateChange,
      timeSinceLastStateChange: Date.now() - this.lastStateChange
    };
  }

  /**
   * Force l'ouverture du circuit (pour tests ou maintenance)
   */
  forceOpen() {
    logger.warn(`Circuit breaker forced OPEN: ${this.name}`);
    this.transitionToOpen();
  }

  /**
   * Force la fermeture du circuit (pour tests ou récupération)
   */
  forceClosed() {
    logger.info(`Circuit breaker forced CLOSED: ${this.name}`);
    this.transitionToClosed();
  }

  /**
   * Réinitialise les métriques
   */
  resetMetrics() {
    this.failures = 0;
    this.successes = 0;
    this.totalCalls = 0;
    this.halfOpenCalls = 0;
    this.callTimings = [];
    this.lastFailureTime = null;
    
    this.metrics = {
      totalCalls: 0,
      totalFailures: 0,
      totalSuccesses: 0,
      totalTimeouts: 0,
      totalSlowCalls: 0,
      averageResponseTime: 0,
      circuitOpenedCount: 0,
      lastFailure: null,
      uptime: Date.now()
    };

    logger.info(`Circuit breaker metrics reset: ${this.name}`);
  }
}

/**
 * Gestionnaire global des circuit breakers
 */
export class CircuitBreakerManager {
  constructor() {
    this.circuits = new Map();
  }

  /**
   * Crée ou récupère un circuit breaker
   */
  getCircuit(name, config = {}) {
    if (!this.circuits.has(name)) {
      this.circuits.set(name, new CircuitBreaker(name, config));
    }
    return this.circuits.get(name);
  }

  /**
   * Exécute une opération avec circuit breaker
   */
  async execute(circuitName, operation, fallback = null, config = {}) {
    const circuit = this.getCircuit(circuitName, config);
    return await circuit.execute(operation, fallback);
  }

  /**
   * Obtient l'état de tous les circuits
   */
  getAllStates() {
    const states = {};
    for (const [name, circuit] of this.circuits) {
      states[name] = circuit.getState();
    }
    return states;
  }

  /**
   * Obtient les métriques globales
   */
  getGlobalMetrics() {
    const totalCircuits = this.circuits.size;
    let openCircuits = 0;
    let halfOpenCircuits = 0;
    let closedCircuits = 0;
    let totalFailures = 0;
    let totalCalls = 0;

    for (const circuit of this.circuits.values()) {
      const state = circuit.getState();
      
      switch (state.state) {
        case CIRCUIT_STATES.OPEN:
          openCircuits++;
          break;
        case CIRCUIT_STATES.HALF_OPEN:
          halfOpenCircuits++;
          break;
        case CIRCUIT_STATES.CLOSED:
          closedCircuits++;
          break;
      }
      
      totalFailures += state.metrics.totalFailures;
      totalCalls += state.metrics.totalCalls;
    }

    return {
      totalCircuits,
      openCircuits,
      halfOpenCircuits,
      closedCircuits,
      globalFailureRate: totalCalls > 0 ? (totalFailures / totalCalls) : 0,
      totalFailures,
      totalCalls
    };
  }

  /**
   * Force l'ouverture de tous les circuits
   */
  forceOpenAll() {
    for (const circuit of this.circuits.values()) {
      circuit.forceOpen();
    }
    logger.warn('All circuit breakers forced OPEN');
  }

  /**
   * Force la fermeture de tous les circuits
   */
  forceCloseAll() {
    for (const circuit of this.circuits.values()) {
      circuit.forceClosed();
    }
    logger.info('All circuit breakers forced CLOSED');
  }

  /**
   * Réinitialise tous les circuits
   */
  resetAll() {
    for (const circuit of this.circuits.values()) {
      circuit.resetMetrics();
      circuit.transitionToClosed();
    }
    logger.info('All circuit breakers reset');
  }
}

// Instance globale
export const circuitBreakerManager = new CircuitBreakerManager();

// Configurations prédéfinies pour différents services
export const CIRCUIT_CONFIGS = {
  payment: {
    failureThreshold: 3,
    recoveryTimeout: 30000,
    timeout: 10000,
    slowCallThreshold: 5000,
    expectedErrors: ['PAYMENT_CANCELLED', 'INSUFFICIENT_FUNDS']
  },
  
  database: {
    failureThreshold: 5,
    recoveryTimeout: 15000,
    timeout: 5000,
    slowCallThreshold: 2000,
    expectedErrors: []
  },
  
  externalApi: {
    failureThreshold: 3,
    recoveryTimeout: 60000,
    timeout: 15000,
    slowCallThreshold: 8000,
    expectedErrors: ['RATE_LIMITED']
  },
  
  notification: {
    failureThreshold: 5,
    recoveryTimeout: 120000,
    timeout: 10000,
    slowCallThreshold: 5000,
    expectedErrors: ['INVALID_RECIPIENT']
  }
};

// Fonction helper pour créer des circuit breakers prédéfinis
export function createCircuitBreaker(name, type = 'default', customConfig = {}) {
  const baseConfig = CIRCUIT_CONFIGS[type] || {};
  const config = { ...baseConfig, ...customConfig };
  return circuitBreakerManager.getCircuit(name, config);
}

export default circuitBreakerManager;
