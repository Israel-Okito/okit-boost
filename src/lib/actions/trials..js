
// src/lib/actions/trials.js
"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function submitTrialRequest(formData) {
  const supabase = await createClient()

  try {
    const trialData = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      platform: formData.get('platform'),
      service: formData.get('service'),
      target_link: formData.get('target_link'),
      notes: formData.get('notes')
    }

    const { error } = await supabase
      .from('trial_requests')
      .insert(trialData)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error submitting trial request:', error)
    throw new Error('Erreur lors de la soumission de la demande')
  }
}
