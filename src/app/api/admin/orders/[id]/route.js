import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// PATCH - Mettre à jour une commande
export async function PATCH(request, { params }) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const body = await request.json()

    const { data: order, error } = await supabase
      .from('orders')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      order
    })

  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour de la commande' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer une commande
export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Supprimer d'abord les items de la commande
    const { error: itemsError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', id)

    if (itemsError) throw itemsError

    // Puis supprimer la commande
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({
      success: true
    })

  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression de la commande' },
      { status: 500 }
    )
  }
}
