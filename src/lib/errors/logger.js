/**
 * Système de logging structuré avancé
 * Supporte rotation, compression et multiple transports
 */

import fs from 'fs/promises';
import path from 'path';
import { createWriteStream } from 'fs';
import { createGzip } from 'zlib';

// Configuration des niveaux de log
export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
};

// Configuration par défaut
const DEFAULT_CONFIG = {
  level: process.env.NODE_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
  logDir: path.join(process.cwd(), 'logs'),
  enableConsole: true,
  // Désactiver l'écriture de fichiers sur Vercel (read-only filesystem)
  enableFile: process.env.NODE_ENV !== 'production' || !process.env.VERCEL,
  enableRotation: true,
  format: 'json', // 'json' ou 'text'
  timezone: 'UTC'
};

/**
 * Classe principale de logging
 */
export class StructuredLogger {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.streams = new Map();
    this.init();
  }

  async init() {
    if (this.config.enableFile) {
      await this.ensureLogDirectory();
      await this.initializeFileStreams();
    }
  }

  /**
   * Assure que le répertoire de logs existe
   */
  async ensureLogDirectory() {
    try {
      await fs.mkdir(this.config.logDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  /**
   * Initialise les streams de fichiers
   */
  async initializeFileStreams() {
    const logTypes = ['error', 'combined', 'access', 'payment', 'security'];
    
    for (const type of logTypes) {
      const filename = path.join(this.config.logDir, `${type}.log`);
      const stream = createWriteStream(filename, { flags: 'a' });
      
      stream.on('error', (error) => {
        console.error(`Log stream error for ${type}:`, error);
      });
      
      this.streams.set(type, stream);
    }
  }

  /**
   * Formate un message de log
   */
  formatMessage(level, message, metadata = {}) {
    const timestamp = new Date().toISOString();
    const levelName = Object.keys(LOG_LEVELS)[level] || 'UNKNOWN';
    
    const logEntry = {
      timestamp,
      level: levelName,
      message,
      ...metadata,
      pid: process.pid,
      hostname: process.env.HOSTNAME || 'unknown',
      service: 'okit-boost',
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
    };

    if (this.config.format === 'json') {
      return JSON.stringify(logEntry) + '\n';
    } else {
      return `[${timestamp}] ${levelName}: ${message} ${JSON.stringify(metadata)}\n`;
    }
  }

  /**
   * Écrit un log
   */
  async write(level, message, metadata = {}, logType = 'combined') {
    // Vérifier le niveau de log
    if (level > this.config.level) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, metadata);

    // Log vers console
    if (this.config.enableConsole) {
      this.writeToConsole(level, formattedMessage);
    }

    // Log vers fichier
    if (this.config.enableFile) {
      await this.writeToFile(formattedMessage, logType);
    }

    // Vérifier la rotation
    if (this.config.enableRotation) {
      await this.checkRotation(logType);
    }
  }

  /**
   * Écrit vers la console avec couleurs
   */
  writeToConsole(level, message) {
    const colors = {
      [LOG_LEVELS.ERROR]: '\x1b[31m',   // Rouge
      [LOG_LEVELS.WARN]: '\x1b[33m',    // Jaune
      [LOG_LEVELS.INFO]: '\x1b[36m',    // Cyan
      [LOG_LEVELS.DEBUG]: '\x1b[35m',   // Magenta
      [LOG_LEVELS.TRACE]: '\x1b[37m'    // Blanc
    };

    const reset = '\x1b[0m';
    const color = colors[level] || '';

  }

  /**
   * Écrit vers fichier
   */
  async writeToFile(message, logType) {
    if (!this.config.enableFile) {
      return; // Skip file writing if disabled
    }
    
    const stream = this.streams.get(logType);
    if (stream && stream.writable) {
      try {
        stream.write(message);
      } catch (error) {
        // Ignore file write errors in production (Vercel read-only filesystem)
        if (process.env.NODE_ENV === 'development') {
          console.error(`Failed to write to log file ${logType}:`, error.message);
        }
      }
    }
  }

  /**
   * Vérifie et effectue la rotation des logs
   */
  async checkRotation(logType) {
    try {
      const filename = path.join(this.config.logDir, `${logType}.log`);
      const stats = await fs.stat(filename);
      
      if (stats.size > this.config.maxFileSize) {
        await this.rotateLog(logType);
      }
    } catch (error) {
      // Fichier n'existe pas encore
    }
  }

  /**
   * Effectue la rotation d'un log
   */
  async rotateLog(logType) {
    try {
      const logFile = path.join(this.config.logDir, `${logType}.log`);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const rotatedFile = path.join(this.config.logDir, `${logType}-${timestamp}.log`);
      
      // Fermer le stream actuel
      const currentStream = this.streams.get(logType);
      if (currentStream) {
        currentStream.end();
      }

      // Renommer le fichier actuel
      await fs.rename(logFile, rotatedFile);
      
      // Compresser le fichier rotaté
      await this.compressLogFile(rotatedFile);
      
      // Créer un nouveau stream
      const newStream = createWriteStream(logFile, { flags: 'a' });
      this.streams.set(logType, newStream);
      
      // Nettoyer les anciens fichiers
      await this.cleanOldLogs(logType);
      
    } catch (error) {
      console.error(`Failed to rotate log ${logType}:`, error);
    }
  }

  /**
   * Compresse un fichier de log
   */
  async compressLogFile(filename) {
    return new Promise((resolve, reject) => {
      const gzip = createGzip();
      const input = fs.createReadStream(filename);
      const output = fs.createWriteStream(`${filename}.gz`);
      
      input.pipe(gzip).pipe(output);
      
      output.on('finish', async () => {
        try {
          await fs.unlink(filename); // Supprimer le fichier non compressé
          resolve();
        } catch (error) {
          reject(error);
        }
      });
      
      output.on('error', reject);
    });
  }

  /**
   * Nettoie les anciens fichiers de log
   */
  async cleanOldLogs(logType) {
    try {
      const files = await fs.readdir(this.config.logDir);
      const logFiles = files
        .filter(file => file.startsWith(`${logType}-`) && file.endsWith('.log.gz'))
        .map(file => ({
          name: file,
          path: path.join(this.config.logDir, file),
          mtime: fs.stat(path.join(this.config.logDir, file)).then(stats => stats.mtime)
        }));

      // Attendre que toutes les dates soient récupérées
      for (const file of logFiles) {
        file.mtime = await file.mtime;
      }

      // Trier par date (plus ancien en premier)
      logFiles.sort((a, b) => a.mtime - b.mtime);

      // Supprimer les fichiers en excès
      if (logFiles.length > this.config.maxFiles) {
        const filesToDelete = logFiles.slice(0, logFiles.length - this.config.maxFiles);
        
        for (const file of filesToDelete) {
          await fs.unlink(file.path);
        }
      }
    } catch (error) {
      console.error(`Failed to clean old logs for ${logType}:`, error);
    }
  }

  /**
   * Méthodes de logging par niveau
   */
  async error(message, metadata = {}) {
    await this.write(LOG_LEVELS.ERROR, message, metadata, 'error');
    await this.write(LOG_LEVELS.ERROR, message, metadata, 'combined');
  }

  async warn(message, metadata = {}) {
    await this.write(LOG_LEVELS.WARN, message, metadata, 'combined');
  }

  async info(message, metadata = {}) {
    // Désactivé en développement pour optimiser les performances
    if (process.env.NODE_ENV === 'production') {
      await this.write(LOG_LEVELS.INFO, message, metadata, 'combined');
    }
  }

  async debug(message, metadata = {}) {
    // Debug complètement désactivé pour performance
    return;
  }

  async trace(message, metadata = {}) {
    await this.write(LOG_LEVELS.TRACE, message, metadata, 'combined');
  }

  /**
   * Logs spécialisés
   */
  async logPayment(action, paymentData, metadata = {}) {
    const paymentLog = {
      action,
      transactionId: paymentData.transactionId,
      amount: paymentData.amount,
      currency: paymentData.currency,
      status: paymentData.status,
      userId: paymentData.userId,
      ...metadata
    };

    await this.write(LOG_LEVELS.INFO, `Payment ${action}`, paymentLog, 'payment');
  }

  async logSecurity(event, details, metadata = {}) {
    const securityLog = {
      event,
      ...details,
      ...metadata,
      severity: details.severity || 'medium'
    };

    await this.write(LOG_LEVELS.WARN, `Security event: ${event}`, securityLog, 'security');
  }

  async logAccess(req, res, responseTime) {
    const accessLog = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      userId: req.user?.id,
      sessionId: req.sessionId
    };

    await this.write(LOG_LEVELS.INFO, 'HTTP Request', accessLog, 'access');
  }

  /**
   * Recherche dans les logs
   */
  async searchLogs(query, options = {}) {
    const {
      logType = 'combined',
      startDate,
      endDate,
      level,
      limit = 100
    } = options;

    try {
      const filename = path.join(this.config.logDir, `${logType}.log`);
      const content = await fs.readFile(filename, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      
      let results = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return { raw: line };
        }
      });

      // Filtrer par date
      if (startDate || endDate) {
        results = results.filter(entry => {
          if (!entry.timestamp) return false;
          const entryDate = new Date(entry.timestamp);
          
          if (startDate && entryDate < new Date(startDate)) return false;
          if (endDate && entryDate > new Date(endDate)) return false;
          
          return true;
        });
      }

      // Filtrer par niveau
      if (level) {
        results = results.filter(entry => entry.level === level);
      }

      // Filtrer par query
      if (query) {
        const queryLower = query.toLowerCase();
        results = results.filter(entry => 
          JSON.stringify(entry).toLowerCase().includes(queryLower)
        );
      }

      // Limiter les résultats
      return results.slice(0, limit);

    } catch (error) {
      console.error('Failed to search logs:', error);
      return [];
    }
  }

  /**
   * Statistiques des logs
   */
  async getLogStats(logType = 'combined', timeRange = '24h') {
    try {
      const filename = path.join(this.config.logDir, `${logType}.log`);
      const content = await fs.readFile(filename, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      
      const now = new Date();
      const cutoff = new Date(now - this.parseTimeRange(timeRange));
      
      const stats = {
        total: 0,
        levels: {},
        timeline: {},
        topErrors: {},
        averagePerHour: 0
      };

      lines.forEach(line => {
        try {
          const entry = JSON.parse(line);
          const entryDate = new Date(entry.timestamp);
          
          if (entryDate >= cutoff) {
            stats.total++;
            
            // Par niveau
            stats.levels[entry.level] = (stats.levels[entry.level] || 0) + 1;
            
            // Timeline (par heure)
            const hour = entryDate.toISOString().slice(0, 13);
            stats.timeline[hour] = (stats.timeline[hour] || 0) + 1;
            
            // Top erreurs
            if (entry.level === 'ERROR') {
              const errorKey = entry.message.slice(0, 100);
              stats.topErrors[errorKey] = (stats.topErrors[errorKey] || 0) + 1;
            }
          }
        } catch {
          // Ignorer les lignes mal formatées
        }
      });

      // Moyenne par heure
      const hours = Math.max(1, Math.ceil(this.parseTimeRange(timeRange) / (1000 * 60 * 60)));
      stats.averagePerHour = Math.round(stats.total / hours * 100) / 100;

      return stats;
    } catch (error) {
      console.error('Failed to get log stats:', error);
      return { total: 0, levels: {}, timeline: {}, topErrors: {}, averagePerHour: 0 };
    }
  }

  /**
   * Parse time range string to milliseconds
   */
  parseTimeRange(timeRange) {
    const match = timeRange.match(/^(\d+)([hmsd])$/);
    if (!match) return 24 * 60 * 60 * 1000; // Default 24h
    
    const [, value, unit] = match;
    const multipliers = {
      's': 1000,
      'm': 60 * 1000,
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000
    };
    
    return parseInt(value) * (multipliers[unit] || multipliers.h);
  }

  /**
   * Ferme tous les streams
   */
  async close() {
    for (const [type, stream] of this.streams) {
      if (stream && stream.writable) {
        await new Promise(resolve => {
          stream.end(resolve);
        });
      }
    }
    this.streams.clear();
  }
}

// Instance globale
export const logger = new StructuredLogger();

// Middleware pour logging automatique des requêtes
export function withRequestLogging(handler) {
  return async (req, res) => {
    const startTime = Date.now();
    
    // Log de la requête entrante
    await logger.debug('Incoming request', {
      method: req.method,
      url: req.url,
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    try {
      const result = await handler(req, res);
      
      // Log de la réponse
      const responseTime = Date.now() - startTime;
      await logger.logAccess(req, res, responseTime);
      
      return result;
    } catch (error) {
      // Log de l'erreur
      const responseTime = Date.now() - startTime;
      await logger.error('Request failed', {
        method: req.method,
        url: req.url,
        error: error.message,
        responseTime: `${responseTime}ms`,
        stack: error.stack
      });
      
      throw error;
    }
  };
}

export default logger;
