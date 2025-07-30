import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request) {
  // update user's auth session
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}







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
