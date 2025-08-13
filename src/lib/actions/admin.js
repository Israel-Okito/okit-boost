"use server"

import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

async function requireAdmin() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    redirect('/connexion')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || profile.role !== 'admin') {
    redirect('/')
  }

  return { supabase, user }
}

export async function updateOrderStatus(orderId, status, adminNotes = '') {
  const { supabase } = await requireAdmin()

  try {
    const validStatuses = ['pending', 'processing', 'completed', 'cancelled', 'refunded']
    if (!validStatuses.includes(status)) {
      throw new Error('Statut invalide')
    }

    const { error } = await supabase
      .from('orders')
      .update({ 
        status,
        admin_notes: adminNotes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (error) {
      console.error('Order update error:', error)
      throw new Error('Erreur lors de la mise à jour de la commande')
    }

    // Revalider les pages qui affichent les commandes
    revalidatePath('/admin')
    revalidatePath('/mon-compte')

    return { success: true }
  } catch (error) {
    console.error('Error updating order status:', error)
    throw error
  }
}


export async function deleteOrder(orderId) {
  const { supabase } = await requireAdmin()

  try {
    // Supprimer d'abord les éléments de commande
    const { error: itemsError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', orderId)

    if (itemsError) {
      throw new Error('Erreur lors de la suppression des éléments de commande')
    }

    // Puis supprimer la commande
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId)

    if (error) {
      throw new Error('Erreur lors de la suppression de la commande')
    }

    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    console.error('Error deleting order:', error)
    throw error
  }
}

export async function verifyPayment(orderId) {
  const { supabase } = await requireAdmin()

  try {
    const { error } = await supabase
      .from('orders')
      .update({ 
        payment_status: 'verified',
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (error) {
      throw new Error('Erreur lors de la vérification du paiement')
    }

    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    console.error('Error verifying payment:', error)
    throw error
  }
}

export async function updateTrialRequestStatus(requestId, status, adminNotes = '') {
  const { supabase } = await requireAdmin()

  try {
    const validStatuses = ['pending', 'approved', 'rejected', 'completed']
    if (!validStatuses.includes(status)) {
      throw new Error('Statut invalide')
    }




    const { error } = await supabase
      .from('trial_requests')
      .update({
        status,
        admin_notes: adminNotes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)

    if (error) {
      throw new Error('Erreur lors de la mise à jour de la demande d\'essai')
    }
    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    console.error('Error updating trial request:', error)
    throw error
  }
}




export async function createManualOrder(orderData) {
  const { supabase } = await requireAdmin()

  try {
    // Validation des données
    if (!orderData.customer_email || !orderData.customer_name || !orderData.items || orderData.items.length === 0) {
      throw new Error('Données de commande incomplètes')
    }

    // Vérifier que tous les services existent
    const serviceIds = orderData.items.map(item => item.service_id)
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .in('id', serviceIds)

    if (servicesError || services.length !== serviceIds.length) {
      throw new Error('Un ou plusieurs services sont invalides')
    }

    // Recalculer les totaux
    let totalUSD = 0
    let totalCDF = 0

    const validatedItems = orderData.items.map(item => {
      const service = services.find(s => s.id === item.service_id)
      const itemTotalUSD = service.price_usd * item.quantity
      const itemTotalCDF = service.price_cdf * item.quantity

      totalUSD += itemTotalUSD
      totalCDF += itemTotalCDF

      return {
        ...item,
        price_usd: service.price_usd,
        price_cdf: service.price_cdf,
        total_usd: itemTotalUSD,
        total_cdf: itemTotalCDF
      }
    })

    // Créer la commande
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: null, // Commande manuelle
        total_usd: totalUSD,
        total_cdf: totalCDF,
        currency: orderData.currency || 'CDF',
        customer_name: orderData.customer_name,
        customer_email: orderData.customer_email,
        customer_phone: orderData.customer_phone,
        payment_method: orderData.payment_method || 'manual',
        status: 'processing', // Directement en traitement
        notes: orderData.notes,
        admin_notes: 'Commande créée manuellement par un administrateur'
      })
      .select()
      .single()

    if (orderError) {
      throw new Error('Erreur lors de la création de la commande')
    }

    // Créer les éléments de commande
    const orderItems = validatedItems.map(item => ({
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

    if (itemsError) {
      throw new Error('Erreur lors de la création des éléments de commande')
    }

    revalidatePath('/admin')
    return { success: true, order_id: order.id, order_number: order.order_number }
  } catch (error) {
    console.error('Error creating manual order:', error)
    throw error
  }
}

export async function exportOrders(filters = {}) {
  const { supabase } = await requireAdmin()

  try {
    let query = supabase
      .from('orders')
      .select(`
        *,
        profiles (full_name, email),
        order_items (
          *,
          services (name, platform_id)
        )
      `)

    // Appliquer les filtres
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom)
    }
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo)
    }

    const { data: orders, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw new Error('Erreur lors de l\'exportation des commandes')
    }

    return { success: true, orders: orders || [] }
  } catch (error) {
    console.error('Error exporting orders:', error)
    throw error
  }
}