import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// PATCH - Mettre à jour une demande d'essai
export async function PATCH(request, { params }) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const body = await request.json()

    const { data: trial, error } = await supabase
      .from('trial_requests')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      trial
    })

  } catch (error) {
    console.error('Error updating trial request:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour de la demande' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer une demande d'essai
export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { error } = await supabase
      .from('trial_requests')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({
      success: true
    })

  } catch (error) {
    console.error('Error deleting trial request:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression de la demande' },
      { status: 500 }
    )
  }
}
