// src/lib/actions/services.js
"use server"

import { createClient } from "@/utils/supabase/server"

export async function getPlatforms() {
  const supabase = await createClient()

  try {
    const { data: platforms, error } = await supabase
      .from('platforms')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) throw error

    return platforms || []
  } catch (error) {
    console.error('Error getting platforms:', error)
    return []
  }
}

export async function getServicesByPlatform(platformId) {
  const supabase = await createClient()

  try {
    const { data: services, error } = await supabase
      .from('services')
      .select('*')
      .eq('platform_id', platformId)
      .eq('is_active', true)
      .order('name')

    if (error) throw error

    return services || []
  } catch (error) {
    console.error('Error getting services:', error)
    return []
  }
}