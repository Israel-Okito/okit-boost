import { z } from 'zod'

export const orderSchema = z.object({
  items: z.array(z.object({
    service_id: z.string().min(1, 'ID du service requis'),
    service_name: z.string().min(1, 'Nom du service requis'),
    platform: z.string().min(1, 'Plateforme requise'),
    target_link: z.string().url('URL valide requise'),
    quantity: z.number().min(1, 'Quantité minimale: 1'),
    price_usd: z.number().min(0, 'Prix USD invalide'),
    price_cdf: z.number().min(0, 'Prix CDF invalide'),
    total_usd: z.number().min(0, 'Total USD invalide'),
    total_cdf: z.number().min(0, 'Total CDF invalide')
  })).min(1, 'Au moins un article requis'),
  total_usd: z.number().min(0, 'Total USD invalide'),
  total_cdf: z.number().min(0, 'Total CDF invalide'),
  currency: z.enum(['USD', 'CDF'], 'Devise invalide'),
  customer_name: z.string().min(2, 'Nom requis (min 2 caractères)'),
  customer_email: z.string().email('Email invalide'),
  customer_phone: z.string().min(10, 'Numéro de téléphone invalide'),
  payment_method: z.enum(['orange', 'airtel', 'mpesa', 'afrimoney', 'manual'], 'Méthode de paiement invalide'),
  notes: z.string().optional()
})

export const trialRequestSchema = z.object({
  name: z.string().min(2, 'Nom requis (min 2 caractères)'),
  email: z.string().email('Email invalide'),
  phone: z.string().min(10, 'Numéro de téléphone invalide'),
  platform: z.string().min(1, 'Plateforme requise'),
  service: z.string().min(1, 'Service requis'),
  target_link: z.string().url('URL valide requise'),
  notes: z.string().optional()
})

export const profileUpdateSchema = z.object({
  full_name: z.string().min(2, 'Nom requis (min 2 caractères)').optional(),
  phone: z.string().min(10, 'Numéro de téléphone invalide').optional()
})
