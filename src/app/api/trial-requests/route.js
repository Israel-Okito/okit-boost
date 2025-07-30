import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    const supabase = await createClient()
    
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

    // Vérifier si l'email n'a pas déjà fait une demande récente
    const { data: existingRequest } = await supabase
      .from('trial_requests')
      .select('created_at')
      .eq('email', trialData.email)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // 24h
      .single()

    if (existingRequest) {
      return NextResponse.json(
        { error: 'Vous avez déjà fait une demande récemment. Veuillez attendre 24h.' },
        { status: 429 }
      )
    }

    const { error } = await supabase
      .from('trial_requests')
      .insert({
        name: trialData.name,
        email: trialData.email,
        phone: trialData.phone,
        platform: trialData.platform,
        service: trialData.service,
        target_link: trialData.target_link,
        notes: trialData.notes || null
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