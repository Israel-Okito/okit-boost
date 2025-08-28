import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// PATCH - Mettre à jour un service
export async function PATCH(request, { params }) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const body = await request.json()

    const { data: service, error } = await supabase
      .from('services')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      service
    })

  } catch (error) {
    console.error('Error updating service:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour du service' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un service
export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({
      success: true
    })

  } catch (error) {
    console.error('Error deleting service:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression du service' },
      { status: 500 }
    )
  }
}
