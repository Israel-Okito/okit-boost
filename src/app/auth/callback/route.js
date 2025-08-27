import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // Récupérer la destination depuis les paramètres ou cookies
  let next = searchParams.get('next') || searchParams.get('redirect') || '/mon-compte'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      console.log(`✅ Authentification réussie, redirection vers: ${next}`)
      
      // URL pour rediriger vers la destination
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    } else {
      console.error('❌ Erreur lors de l\'échange de code:', error)
    }
  } else {
    console.error('❌ Code d\'authentification manquant')
  }

  // Rediriger vers la page d'erreur avec des paramètres pour debug
  return NextResponse.redirect(`${origin}/auth/auth-code-error?error=auth_code_error`)
}
