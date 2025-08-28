// src/lib/actions/orders.js
"use server"

import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { orderSchema } from "@/lib/validations"

export async function createOrder(orderData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/connexion')
  }

  try {
    // Validation des données avec Zod
    const validatedData = orderSchema.parse(orderData)

    // Vérifier que tous les services existent et sont actifs
    const serviceIds = validatedData.items.map(item => item.service_id)
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .in('id', serviceIds)
      .eq('is_active', true)

    if (servicesError) throw servicesError

    if (services.length !== serviceIds.length) {
      throw new Error('Un ou plusieurs services sont invalides ou indisponibles')
    }

    // Recalculer les totaux pour la sécurité
    let totalUSD = 0
    let totalCDF = 0

    const validatedItems = validatedData.items.map(item => {
      const service = services.find(s => s.id === item.service_id)
      if (!service) {
        throw new Error(`Service ${item.service_id} non trouvé`)
      }

      // Vérifier les limites de quantité
      if (item.quantity < service.min_quantity || item.quantity > service.max_quantity) {
        throw new Error(`Quantité invalide pour ${service.name}. Min: ${service.min_quantity}, Max: ${service.max_quantity}`)
      }

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

    // Vérifier que les totaux correspondent
    if (Math.abs(totalUSD - validatedData.total_usd) > 0.01 || Math.abs(totalCDF - validatedData.total_cdf) > 1) {
      throw new Error('Erreur de calcul des totaux')
    }

    // Créer la commande avec transaction
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        total_usd: totalUSD,
        total_cdf: totalCDF,
        currency: validatedData.currency,
        customer_name: validatedData.customer_name,
        customer_email: validatedData.customer_email,
        customer_phone: validatedData.customer_phone,
        payment_method: validatedData.payment_method,
        notes: validatedData.notes,
        status: 'pending'
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Créer les éléments de commande
    const orderItems = validatedItems.map(item => ({
      order_id: order.id,
      service_id: item.service_id,
      service_name: item.service_name,
      platform_name: item.platform,
      target_link: item.target_link,
      quantity: item.quantity,
      price_usd: item.price_usd,
      price_cdf: item.price_cdf,
      total_usd: item.total_usd,
      total_cdf: item.total_cdf
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      // Rollback: supprimer la commande si les items n'ont pas pu être créés
      await supabase.from('orders').delete().eq('id', order.id)
      throw itemsError
    }

    revalidatePath('/mon-compte')
    revalidatePath('/admin')

    return { 
      success: true, 
      order_id: order.id, 
      order_number: order.order_number 
    }
  } catch (error) {
    console.error('Order creation error:', error)
    if (error.name === 'ZodError') {
      throw new Error('Données de commande invalides: ' + error.errors[0].message)
    }
    throw error
  }
}

export async function uploadPaymentProof(orderId, fileData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Non authentifié')
  }

  try {
    // Vérifier que la commande appartient à l'utilisateur
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single()

    if (orderError || !order) {
      throw new Error('Commande non trouvée')
    }

    if (order.status !== 'pending') {
      throw new Error('Impossible de télécharger une preuve pour cette commande')
    }

    // Créer le fichier à partir des données base64
    const buffer = Buffer.from(fileData.data, 'base64')
    const fileName = `payment-proofs/${orderId}-${Date.now()}.${fileData.type.split('/')[1]}`
    
    const { data, error: uploadError } = await supabase.storage
      .from('payment-proofs')
      .upload(fileName, buffer, {
        contentType: fileData.type,
        cacheControl: '3600',
        upsert: false
      })

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

    if (updateError) throw updateError

    revalidatePath('/mon-compte')
    revalidatePath('/admin')

    return { success: true, url: publicUrl }
  } catch (error) {
    console.error('Error uploading payment proof:', error)
    throw error
  }
}

export async function cancelOrder(orderId, reason) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Non authentifié')
  }

  try {
    // Vérifier que la commande appartient à l'utilisateur et peut être annulée
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single()

    if (orderError || !order) {
      throw new Error('Commande non trouvée')
    }

    if (!['pending', 'processing'].includes(order.status)) {
      throw new Error('Cette commande ne peut plus être annulée')
    }

    const { error } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        notes: reason ? `Annulée par le client: ${reason}` : 'Annulée par le client',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (error) throw error

    revalidatePath('/mon-compte')
    revalidatePath('/admin')

    return { success: true }
  } catch (error) {
    console.error('Error cancelling order:', error)
    throw error
  }
}

export async function reorderItems(orderId) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Non authentifié')
  }

  try {
    // Récupérer la commande originale avec ses items
    const { data: originalOrder, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          services (*)
        )
      `)
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single()

    if (orderError || !originalOrder) {
      throw new Error('Commande originale non trouvée')
    }

    // Vérifier que tous les services sont encore disponibles
    const unavailableServices = originalOrder.order_items.filter(
      item => !item.services || !item.services.is_active
    )

    if (unavailableServices.length > 0) {
      throw new Error('Certains services ne sont plus disponibles')
    }

    // Recalculer les totaux avec les prix actuels
    let totalUSD = 0
    let totalCDF = 0

    const newItems = originalOrder.order_items.map(item => {
      const service = item.services
      const itemTotalUSD = service.price_usd * item.quantity
      const itemTotalCDF = service.price_cdf * item.quantity

      totalUSD += itemTotalUSD
      totalCDF += itemTotalCDF

      return {
        service_id: item.service_id,
        service_name: service.name,
        platform_name: item.platform_name,
        target_link: item.target_link,
        quantity: item.quantity,
        price_usd: service.price_usd,
        price_cdf: service.price_cdf,
        total_usd: itemTotalUSD,
        total_cdf: itemTotalCDF
      }
    })

    // Créer la nouvelle commande
    const orderData = {
      items: newItems,
      total_usd: totalUSD,
      total_cdf: totalCDF,
      currency: originalOrder.currency,
      customer_name: originalOrder.customer_name,
      customer_email: originalOrder.customer_email,
      customer_phone: originalOrder.customer_phone,
      payment_method: originalOrder.payment_method,
      notes: `Recommande à partir de ${originalOrder.order_number}`
    }

    return await createOrder(orderData)
  } catch (error) {
    console.error('Error reordering:', error)
    throw error
  }
}