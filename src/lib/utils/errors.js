export class AppError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
      super(message)
      this.statusCode = statusCode
      this.code = code
      this.name = 'AppError'
    }
  }
  
  export class ValidationError extends AppError {
    constructor(message, field = null) {
      super(message, 400, 'VALIDATION_ERROR')
      this.field = field
    }
  }
  
  export class AuthenticationError extends AppError {
    constructor(message = 'Non authentifié') {
      super(message, 401, 'AUTHENTICATION_ERROR')
    }
  }
  
  export class AuthorizationError extends AppError {
    constructor(message = 'Accès refusé') {
      super(message, 403, 'AUTHORIZATION_ERROR')
    }
  }
  
  export class NotFoundError extends AppError {
    constructor(message = 'Ressource non trouvée') {
      super(message, 404, 'NOT_FOUND_ERROR')
    }
  }
  
  export function handleApiError(error) {
    console.error('API Error:', error)
  
    if (error instanceof AppError) {
      return {
        error: error.message,
        code: error.code,
        statusCode: error.statusCode
      }
    }
  
    // Erreurs Supabase
    if (error.code) {
      switch (error.code) {
        case '23505': // Violation de contrainte unique
          return {
            error: 'Cette ressource existe déjà',
            code: 'DUPLICATE_ERROR',
            statusCode: 409
          }
        case '23503': // Violation de clé étrangère
          return {
            error: 'Référence invalide',
            code: 'REFERENCE_ERROR',
            statusCode: 400
          }
        case 'PGRST116': // Aucun résultat trouvé
          return {
            error: 'Ressource non trouvée',
            code: 'NOT_FOUND_ERROR',
            statusCode: 404
          }
      }
    }
  
    return {
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR',
      statusCode: 500
    }
  }
  