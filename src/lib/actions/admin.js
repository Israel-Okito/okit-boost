
// src/lib/actions/admin.js
"use server"

import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

async function requireAdmin() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/connexion')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/')
  }

  return { supabase, user }
}

export async function getAdminStats() {
  const { supabase } = await requireAdmin()

  try {
    // Statistiques générales
    const [
      { count: totalOrders },
      { count: pendingOrders },
      { count: totalUsers },
      { data: recentOrders }
    ] = await Promise.all([
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'user'),
      supabase
        .from('orders')
        .select(`
          *,
          profiles (full_name, email),
          order_items (
            *,
            services (name, platform_id)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10)
    ])

    // Revenus totaux
    const { data: revenueData } = await supabase
      .from('orders')
      .select('total_cdf, total_usd')
      .eq('status', 'completed')

    const totalRevenueCDF = revenueData?.reduce((sum, order) => sum + order.total_cdf, 0) || 0
    const totalRevenueUSD = revenueData?.reduce((sum, order) => sum + order.total_usd, 0) || 0

    return {
      totalOrders: totalOrders || 0,
      pendingOrders: pendingOrders || 0,
      totalUsers: totalUsers || 0,
      totalRevenueCDF,
      totalRevenueUSD,
      recentOrders: recentOrders || []
    }
  } catch (error) {
    console.error('Error getting admin stats:', error)
    return {
      totalOrders: 0,
      pendingOrders: 0,
      totalUsers: 0,
      totalRevenueCDF: 0,
      totalRevenueUSD: 0,
      recentOrders: []
    }
  }
}

export async function updateOrderStatus(orderId, status, adminNotes = '') {
  const { supabase } = await requireAdmin()

  try {
    const { error } = await supabase
      .from('orders')
      .update({ 
        status,
        admin_notes: adminNotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (error) throw error

    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    console.error('Error updating order status:', error)
    throw new Error('Erreur lors de la mise à jour du statut')
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

    if (error) throw error

    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    console.error('Error verifying payment:', error)
    throw new Error('Erreur lors de la vérification du paiement')
  }
}
