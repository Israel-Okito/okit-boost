// src/app/api/trial-requests/route.js
import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    
    const trialData = await request.json()

    // Validation des données
    const requiredFields = ['name', 'email', 'phone', 'platform', 'service', 'target_link']
    for (const field of requiredFields) {
      if (!trialData[field]) {
        return NextResponse.json(
          { error: `Le champ ${field} est requis` },
          { status: 400 }
        )
      }
    }

    // Vérifier si l'utilisateur n'a pas déjà fait une demande
    const { data: existingRequest } = await supabase
      .from('trial_requests')
      .select('id')
      .eq('email', trialData.email)
      .single()

    if (existingRequest) {
      return NextResponse.json(
        { error: 'Vous avez déjà fait une demande d\'essai.' },
        { status: 429 }
      )
    }

    // Insérer la nouvelle demande avec l'ID utilisateur
    const { error } = await supabase
      .from('trial_requests')
      .insert({
        user_id: user.id,
        name: trialData.name,
        email: trialData.email,
        phone: trialData.phone,
        platform: trialData.platform,
        service: trialData.service,
        target_link: trialData.target_link,
        notes: trialData.notes || null,
        status: 'pending'
      })

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Trial request error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la soumission de la demande' },
      { status: 500 }
    )
  }
}