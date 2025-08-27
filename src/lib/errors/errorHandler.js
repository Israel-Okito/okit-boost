/**
 * Système de gestion d'erreurs avancé
 * Inclut retry automatique, logging structuré et classification d'erreurs
 */

import { createClient } from '@supabase/supabase-js';

// Configuration des types d'erreurs
export const ERROR_TYPES = {
  PAYMENT: 'PAYMENT',
  DATABASE: 'DATABASE', 
  NETWORK: 'NETWORK',
  VALIDATION: 'VALIDATION',
  AUTHENTICATION: 'AUTHENTICATION',
  AUTHORIZATION: 'AUTHORIZATION',
  RATE_LIMIT: 'RATE_LIMIT',
  SYSTEM: 'SYSTEM',
  EXTERNAL_API: 'EXTERNAL_API'
};

// Configuration des niveaux de sévérité
export const SEVERITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Configuration du retry
const RETRY_CONFIG = {
  [ERROR_TYPES.PAYMENT]: { maxAttempts: 3, baseDelay: 1000, maxDelay: 10000 },
  [ERROR_TYPES.DATABASE]: { maxAttempts: 3, baseDelay: 500, maxDelay: 5000 },
  [ERROR_TYPES.NETWORK]: { maxAttempts: 5, baseDelay: 1000, maxDelay: 30000 },
  [ERROR_TYPES.EXTERNAL_API]: { maxAttempts: 3, baseDelay: 2000, maxDelay: 15000 },
  default: { maxAttempts: 2, baseDelay: 1000, maxDelay: 5000 }
};

/**
 * Classe principale pour la gestion d'erreurs
 */
export class ErrorHandler {
  constructor() {
    this.supabase = null;
    this.initSupabase();
  }

  async initSupabase() {
    try {
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
    } catch (error) {
      console.error('Failed to initialize Supabase for error logging:', error);
    }
  }

  /**
   * Classifie automatiquement le type d'erreur
   */
  classifyError(error) {
    const message = error.message?.toLowerCase() || '';
    const stack = error.stack?.toLowerCase() || '';

    // Classification par message d'erreur
    if (message.includes('payment') || message.includes('cinetpay') || message.includes('transaction')) {
      return ERROR_TYPES.PAYMENT;
    }
    
    if (message.includes('database') || message.includes('supabase') || message.includes('sql')) {
      return ERROR_TYPES.DATABASE;
    }

    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return ERROR_TYPES.NETWORK;
    }

    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return ERROR_TYPES.VALIDATION;
    }

    if (message.includes('unauthorized') || message.includes('forbidden') || message.includes('auth')) {
      return ERROR_TYPES.AUTHENTICATION;
    }

    if (message.includes('rate limit') || message.includes('too many requests')) {
      return ERROR_TYPES.RATE_LIMIT;
    }

    // Classification par code d'erreur HTTP
    if (error.status) {
      if (error.status === 401) return ERROR_TYPES.AUTHENTICATION;
      if (error.status === 403) return ERROR_TYPES.AUTHORIZATION;
      if (error.status === 429) return ERROR_TYPES.RATE_LIMIT;
      if (error.status >= 500) return ERROR_TYPES.SYSTEM;
    }

    return ERROR_TYPES.SYSTEM;
  }

  /**
   * Détermine la sévérité de l'erreur
   */
  determineSeverity(errorType, error) {
    // Erreurs critiques
    if (errorType === ERROR_TYPES.PAYMENT && error.message?.includes('failed')) {
      return SEVERITY_LEVELS.CRITICAL;
    }

    if (errorType === ERROR_TYPES.DATABASE && error.message?.includes('connection')) {
      return SEVERITY_LEVELS.CRITICAL;
    }

    // Erreurs haute priorité
    if (errorType === ERROR_TYPES.PAYMENT || errorType === ERROR_TYPES.AUTHENTICATION) {
      return SEVERITY_LEVELS.HIGH;
    }

    // Erreurs moyennes
    if (errorType === ERROR_TYPES.VALIDATION || errorType === ERROR_TYPES.NETWORK) {
      return SEVERITY_LEVELS.MEDIUM;
    }

    // Erreurs faibles
    return SEVERITY_LEVELS.LOW;
  }

  /**
   * Crée un contexte d'erreur enrichi
   */
  createErrorContext(error, additionalContext = {}) {
    return {
      timestamp: new Date().toISOString(),
      errorId: this.generateErrorId(),
      message: error.message,
      stack: error.stack,
      name: error.name,
      type: this.classifyError(error),
      severity: this.determineSeverity(this.classifyError(error), error),
      userAgent: additionalContext.userAgent,
      userId: additionalContext.userId,
      sessionId: additionalContext.sessionId,
      requestId: additionalContext.requestId,
      endpoint: additionalContext.endpoint,
      method: additionalContext.method,
      ip: additionalContext.ip,
      metadata: {
        environment: process.env.NODE_ENV,
        version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
        ...additionalContext.metadata
      }
    };
  }

  /**
   * Génère un ID unique pour l'erreur
   */
  generateErrorId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `err_${timestamp}_${random}`;
  }

  /**
   * Log structuré des erreurs
   */
  async logError(error, context = {}) {
    const errorContext = this.createErrorContext(error, context);
    
    // Log console avec formatage coloré
    this.logToConsole(errorContext);
    
    // Log vers Supabase si disponible
    await this.logToDatabase(errorContext);
    
    // Log vers service externe si configuré (ex: Sentry, LogRocket)
    await this.logToExternalService(errorContext);

    return errorContext;
  }

  /**
   * Log console avec formatage coloré
   */
  logToConsole(errorContext) {
    const colors = {
      [SEVERITY_LEVELS.LOW]: '\x1b[32m',      // Vert
      [SEVERITY_LEVELS.MEDIUM]: '\x1b[33m',   // Jaune
      [SEVERITY_LEVELS.HIGH]: '\x1b[35m',     // Magenta
      [SEVERITY_LEVELS.CRITICAL]: '\x1b[31m'  // Rouge
    };

    const reset = '\x1b[0m';
    const color = colors[errorContext.severity] || colors[SEVERITY_LEVELS.LOW];

    console.error(
      `${color}[${errorContext.severity.toUpperCase()}] ${errorContext.type}${reset}`,
      `\nError ID: ${errorContext.errorId}`,
      `\nMessage: ${errorContext.message}`,
      `\nEndpoint: ${errorContext.endpoint || 'N/A'}`,
      `\nUser: ${errorContext.userId || 'Anonymous'}`,
      `\nTimestamp: ${errorContext.timestamp}`,
      errorContext.stack ? `\nStack:\n${errorContext.stack}` : ''
    );
  }

  /**
   * Log vers la base de données
   */
  async logToDatabase(errorContext) {
    if (!this.supabase) return;

    try {
      await this.supabase
        .from('error_logs')
        .insert({
          error_id: errorContext.errorId,
          type: errorContext.type,
          severity: errorContext.severity,
          message: errorContext.message,
          stack: errorContext.stack,
          context: errorContext,
          user_id: errorContext.userId,
          created_at: errorContext.timestamp
        });
    } catch (dbError) {
      console.error('Failed to log error to database:', dbError);
    }
  }

  /**
   * Log vers service externe
   */
  async logToExternalService(errorContext) {
    // Ici on peut intégrer Sentry, LogRocket, etc.
    if (process.env.SENTRY_DSN && errorContext.severity === SEVERITY_LEVELS.CRITICAL) {
      // Exemple d'intégration Sentry
      try {
        // await Sentry.captureException(new Error(errorContext.message), {
        //   tags: { type: errorContext.type, severity: errorContext.severity },
        //   extra: errorContext
        // });
      } catch (sentryError) {
        console.error('Failed to log to Sentry:', sentryError);
      }
    }
  }

  /**
   * Fonction de retry avec backoff exponentiel
   */
  async withRetry(operation, errorType = 'default', context = {}) {
    const config = RETRY_CONFIG[errorType] || RETRY_CONFIG.default;
    let lastError;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        const result = await operation();
        
        // Log succès après retry
        if (attempt > 1) {
          await this.logError(
            new Error(`Operation succeeded after ${attempt} attempts`),
            { ...context, type: 'RETRY_SUCCESS', metadata: { attempts: attempt } }
          );
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        // Log tentative échouée
        await this.logError(error, {
          ...context,
          metadata: { 
            attempt, 
            maxAttempts: config.maxAttempts,
            retryType: errorType,
            ...context.metadata 
          }
        });

        // Si c'est la dernière tentative, on throw l'erreur
        if (attempt === config.maxAttempts) {
          throw error;
        }

        // Calculer le délai avec backoff exponentiel et jitter
        const delay = Math.min(
          config.baseDelay * Math.pow(2, attempt - 1),
          config.maxDelay
        );
        
        // Ajouter du jitter pour éviter les thundering herds
        const jitter = Math.random() * 0.1 * delay;
        const finalDelay = delay + jitter;

        await this.sleep(finalDelay);
      }
    }

    throw lastError;
  }

  /**
   * Utilitaire pour les délais
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Wrapper pour les opérations critiques
   */
  async safeExecute(operation, context = {}) {
    try {
      return await operation();
    } catch (error) {
      const errorContext = await this.logError(error, context);
      
      // Pour les erreurs critiques, on peut déclencher des alertes
      if (errorContext.severity === SEVERITY_LEVELS.CRITICAL) {
        await this.triggerAlert(errorContext);
      }
      
      throw error;
    }
  }

  /**
   * Déclenchement d'alertes pour erreurs critiques
   */
  async triggerAlert(errorContext) {
    // Ici on peut intégrer des notifications (email, Slack, SMS)
    console.error(`🚨 CRITICAL ERROR ALERT: ${errorContext.errorId}`);
    
    // Exemple d'envoi d'email ou notification Slack
    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        // await this.sendSlackAlert(errorContext);
      } catch (alertError) {
        console.error('Failed to send alert:', alertError);
      }
    }
  }

  /**
   * Méthodes de récupération d'erreurs spécifiques
   */
  
  // Récupération pour erreurs de paiement
  async handlePaymentError(error, paymentData, context = {}) {
    const errorType = ERROR_TYPES.PAYMENT;
    
    return await this.withRetry(
      async () => {
        // Logique de récupération spécifique aux paiements
        throw error; // Pour déclencher le retry
      },
      errorType,
      { ...context, metadata: { paymentData, ...context.metadata } }
    );
  }

  // Récupération pour erreurs de base de données
  async handleDatabaseError(error, query, context = {}) {
    const errorType = ERROR_TYPES.DATABASE;
    
    return await this.withRetry(
      async () => {
        // Logique de récupération spécifique à la DB
        throw error; // Pour déclencher le retry
      },
      errorType,
      { ...context, metadata: { query, ...context.metadata } }
    );
  }

  // Récupération pour erreurs d'API externe
  async handleExternalApiError(error, apiName, endpoint, context = {}) {
    const errorType = ERROR_TYPES.EXTERNAL_API;
    
    return await this.withRetry(
      async () => {
        // Logique de récupération spécifique aux APIs externes
        throw error; // Pour déclencher le retry
      },
      errorType,
      { ...context, metadata: { apiName, endpoint, ...context.metadata } }
    );
  }
}

// Instance globale
export const errorHandler = new ErrorHandler();

// Middleware pour Express/Next.js
export function withErrorHandling(handler) {
  return async (req, res) => {
    try {
      return await handler(req, res);
    } catch (error) {
      const context = {
        endpoint: req.url,
        method: req.method,
        userAgent: req.headers['user-agent'],
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userId: req.user?.id,
        sessionId: req.sessionId,
        requestId: req.id
      };

      await errorHandler.logError(error, context);

      // Réponse d'erreur standardisée
      const errorResponse = {
        error: true,
        message: 'Une erreur interne est survenue',
        errorId: context.errorId,
        timestamp: new Date().toISOString()
      };

      // En développement, on peut exposer plus de détails
      if (process.env.NODE_ENV === 'development') {
        errorResponse.details = error.message;
        errorResponse.stack = error.stack;
      }

      res.status(500).json(errorResponse);
    }
  };
}

// Hook React pour gestion d'erreurs côté client
export function useErrorHandler() {
  const handleError = async (error, context = {}) => {
    const enrichedContext = {
      ...context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      metadata: {
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        ...context.metadata
      }
    };

    return await errorHandler.logError(error, enrichedContext);
  };

  const withRetry = async (operation, errorType, context = {}) => {
    return await errorHandler.withRetry(operation, errorType, context);
  };

  const safeExecute = async (operation, context = {}) => {
    return await errorHandler.safeExecute(operation, context);
  };

  return {
    handleError,
    withRetry,
    safeExecute,
    ERROR_TYPES,
    SEVERITY_LEVELS
  };
}

export default errorHandler;
