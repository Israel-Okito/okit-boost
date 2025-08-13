// import { updateSession } from '@/utils/supabase/middleware'

// export async function middleware(request) {
//   // update user's auth session
//   return await updateSession(request)
// }

// export const config = {
//   matcher: [
//     /*
//      * Match all request paths except for the ones starting with:
//      * - _next/static (static files)
//      * - _next/image (image optimization files)
//      * - favicon.ico (favicon file)
//      * Feel free to modify this pattern to include more paths.
//      */
//     '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
//   ],
// }







// import { updateSession } from '@/utils/supabase/middleware'
// import { createServerClient } from '@supabase/ssr'
// import { NextResponse } from 'next/server'

// export async function middleware(request) {
//   // Mettre à jour la session Supabase
//   let response = await updateSession(request)

//   // Protection des routes admin
//   if (request.nextUrl.pathname.startsWith('/admin')) {
//     const supabase = createServerClient(
//       process.env.NEXT_PUBLIC_SUPABASE_URL,
//       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
//       {
//         cookies: {
//           getAll() {
//             return request.cookies.getAll()
//           },
//           setAll(cookiesToSet) {
//             // Pas besoin de définir les cookies ici pour la vérification
//           },
//         },
//       }
//     )

//     const { data: { user } } = await supabase.auth.getUser()

//     if (!user) {
//       return NextResponse.redirect(new URL('/connexion', request.url))
//     }

//     // Vérifier le rôle admin
//     const { data: profile } = await supabase
//       .from('profiles')
//       .select('role')
//       .eq('id', user.id)
//       .single()

//     if (!profile || profile.role !== 'admin') {
//       return NextResponse.redirect(new URL('/', request.url))
//     }
//   }

//   // Protection des routes utilisateur connecté
//   const protectedRoutes = ['/mon-compte', '/caisse']
//   if (protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
//     const supabase = createServerClient(
//       process.env.NEXT_PUBLIC_SUPABASE_URL,
//       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
//       {
//         cookies: {
//           getAll() {
//             return request.cookies.getAll()
//           },
//           setAll(cookiesToSet) {
//             // Pas besoin de définir les cookies ici pour la vérification
//           },
//         },
//       }
//     )

//     const { data: { user } } = await supabase.auth.getUser()

//     if (!user) {
//       return NextResponse.redirect(new URL('/connexion', request.url))
//     }
//   }

//   return response
// }

// export const config = {
//   matcher: [
//     '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
//   ],
// }



















// src/middleware.js
import { updateSession } from '@/utils/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {


   // Créer le client Supabase pour vérifier l'authentification
   const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Mettre à jour la session Supabase
  let response = await updateSession(request)

  const { pathname } = request.nextUrl

  // Routes publiques qui ne nécessitent pas d'authentification
  const publicRoutes = [
    '/',
    '/connexion',
    '/auth/callback',
    '/auth/auth-code-error',
    '/formulaire-dessai',
    '/services',
    '/faq',
    '/conditions-utilisation',
    'contact'
  ]

  // Routes API publiques
  const publicApiRoutes = [
    '/api/auth/callback',
    '/api/trial-requests',
    '/api/platforms',
    '/api/services'
  ]

  // Vérifier si la route est publique
  const isPublicRoute = publicRoutes.includes(pathname) || 
                       publicRoutes.some(route => pathname.startsWith(route + '/')) ||
                       publicApiRoutes.includes(pathname) ||
                       publicApiRoutes.some(route => pathname.startsWith(route + '/'))

  // Routes statiques et assets
  const isStaticAsset = pathname.startsWith('/_next/') ||
                       pathname.startsWith('/favicon') ||
                       pathname.includes('.')

  if (isStaticAsset) {
    return response
  }

 
  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    // Protection des routes admin
    if (pathname.startsWith('/admin')) {
      if (!user) {
        const redirectUrl = new URL('/connexion', request.url)
        redirectUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(redirectUrl)
      }

      // Vérifier le rôle admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError || !profile || profile.role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url))
      }
    }

    // Protection des routes utilisateur authentifié
    // const protectedRoutes = ['/mon-compte', '/caisse']
    // const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

    // if (isProtectedRoute && !user) {
    //   const redirectUrl = new URL('/connexion', request.url)
    //   redirectUrl.searchParams.set('redirect', pathname)
    //   return NextResponse.redirect(redirectUrl)
    // }

    const pathnamecompte = request.nextUrl.pathname
    const isProtectedRoutecompte = pathnamecompte.startsWith('/mon-compte')
  
    if (isProtectedRoutecompte && !user) {
      const redirectUrl = new URL('/connexion', request.url)
      redirectUrl.searchParams.set('redirect', pathnamecaisse)
      return NextResponse.redirect(redirectUrl)
    }

    const pathnamecaisse = request.nextUrl.pathname
    const isProtectedRoutecaisse = pathnamecaisse.startsWith('/caisse')
  
    if (isProtectedRoutecaisse && !user) {
      const redirectUrl = new URL('/connexion', request.url)
      redirectUrl.searchParams.set('redirect', pathnamecaisse)
      return NextResponse.redirect(redirectUrl)
    }



    // Protection des API routes admin
    if (pathname.startsWith('/api/admin')) {
      if (!user) {
        return new NextResponse(
          JSON.stringify({ error: 'Non authentifié' }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'admin') {
        return new NextResponse(
          JSON.stringify({ error: 'Accès refusé' }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    }

    // Protection des API routes utilisateur
    const userApiRoutes = ['/api/orders', '/api/upload']
    const isUserApiRoute = userApiRoutes.some(route => pathname.startsWith(route))

    if (isUserApiRoute && !user) {
      return new NextResponse(
        JSON.stringify({ error: 'Non authentifié' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Redirection des utilisateurs connectés depuis les pages de connexion
    if ((pathname === '/connexion') && user) {
      const redirectTo = request.nextUrl.searchParams.get('redirect') || '/'
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }

  } catch (error) {
    console.error('Middleware error:', error)
    // En cas d'erreur, laisser passer la requête mais sans authentification
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}