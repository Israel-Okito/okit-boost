// API endpoint pour les tokens CSRF
import { getCSRFTokenHandler } from '@/lib/security/csrf'
import { rateLimit } from '@/lib/security/rateLimit'

// Rate limiting spécial pour les tokens CSRF
const csrfRateLimit = rateLimit('/api/csrf-token')

export async function GET(request) {
  // Rate limiting
  const rateLimitCheck = await csrfRateLimit(request)
  if (rateLimitCheck) return rateLimitCheck
  
  // Générer et retourner le token
  return getCSRFTokenHandler(request)
}
