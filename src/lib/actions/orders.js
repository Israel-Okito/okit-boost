// src/lib/actions/orders.js
"use server"

import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function createOrder(orderData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/connexion')
  }

  try {
    // Créer la commande
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        total_usd: orderData.total_usd,
        total_cdf: orderData.total_cdf,
        currency: orderData.currency,
        customer_name: orderData.customer_name,
        customer_email: orderData.customer_email,
        customer_phone: orderData.customer_phone,
        payment_method: orderData.payment_method,
        notes: orderData.notes
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Créer les éléments de commande
    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      service_id: item.service_id,
      service_name: item.service_name,
      platform_name: item.platform,
      target_link: item.target_link,
      quantity: item.quantity,
      unit_price_usd: item.price_usd,
      unit_price_cdf: item.price_cdf,
      total_usd: item.total_usd,
      total_cdf: item.total_cdf
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    return { success: true, order_id: order.id, order_number: order.order_number }
  } catch (error) {
    console.error('Error creating order:', error)
    throw new Error('Erreur lors de la création de la commande')
  }
}

export async function uploadPaymentProof(orderId, file) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Non authentifié')
  }

  try {
    // Upload du fichier
    const fileName = `payment-proofs/${orderId}-${Date.now()}.${file.name.split('.').pop()}`
    
    const { data, error: uploadError } = await supabase.storage
      .from('payment-proofs')
      .upload(fileName, file)

    if (uploadError) throw uploadError

    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('payment-proofs')
      .getPublicUrl(fileName)

    // Mettre à jour la commande
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        payment_proof_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .eq('user_id', user.id) // Sécurité : seulement ses propres commandes

    if (updateError) throw updateError

    revalidatePath('/mon-compte')
    return { success: true, url: publicUrl }
  } catch (error) {
    console.error('Error uploading payment proof:', error)
    throw new Error('Erreur lors du téléchargement de la preuve')
  }
}

export async function getUserOrders() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return []
  }

  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          services (name, platform_id)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return orders || []
  } catch (error) {
    console.error('Error getting user orders:', error)
    return []
  }
}
