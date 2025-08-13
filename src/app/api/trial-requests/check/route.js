// src/app/api/trial-requests/check/route.js
import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      )
    }

    // Vérifier si l'utilisateur a déjà fait une demande avec cet email
    // On peut vérifier soit par user_id soit par email pour plus de sécurité
    const { data: existingRequest, error } = await supabase
      .from('trial_requests')
      .select('id, status, created_at, email, user_id')
      .or(`user_id.eq.${user.id},email.eq.${email}`)
      .maybeSingle()

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    // Si une demande existe, vérifier si c'est bien la même personne
    const hasExistingRequest = !!existingRequest

    return NextResponse.json({ 
      hasExisting: hasExistingRequest,
      request: existingRequest || null,
      message: hasExistingRequest ? 'Une demande d\'essai existe déjà pour ce compte' : 'Aucune demande existante'
    })

  } catch (error) {
    console.error('Trial check error:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la vérification',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// Optionnel : Méthode GET pour vérifier directement via l'utilisateur connecté
export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier les demandes de l'utilisateur connecté
    const { data: existingRequests, error } = await supabase
      .from('trial_requests')
      .select('id, status, created_at, platform, service')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    return NextResponse.json({ 
      hasExisting: existingRequests && existingRequests.length > 0,
      requests: existingRequests || [],
      count: existingRequests ? existingRequests.length : 0
    })

  } catch (error) {
    console.error('Trial check error:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la vérification',
        details: error.message 
      },
      { status: 500 }
    )
  }
}