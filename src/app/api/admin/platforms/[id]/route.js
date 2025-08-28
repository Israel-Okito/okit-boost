import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// PATCH - Mettre à jour une plateforme
export async function PATCH(request, { params }) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const body = await request.json()

    const { data: platform, error } = await supabase
      .from('platforms')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      platform
    })

  } catch (error) {
    console.error('Error updating platform:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour de la plateforme' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer une plateforme
export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Supprimer d'abord tous les services associés
    const { error: servicesError } = await supabase
      .from('services')
      .delete()
      .eq('platform_id', id)

    if (servicesError) throw servicesError

    // Puis supprimer la plateforme
    const { error } = await supabase
      .from('platforms')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({
      success: true
    })

  } catch (error) {
    console.error('Error deleting platform:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression de la plateforme' },
      { status: 500 }
    )
  }
}
