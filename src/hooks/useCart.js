"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"



export const useCart = create()(
  persist(
    (set, get) => ({
      items: [],
      // Migration automatique des anciens items
      migrateItems: () => set((state) => ({
        items: state.items.map(item => ({
          ...item,
          // Migrer platform vers platform_id si nécessaire
          platform_id: item.platform_id || item.platform,
          // Supprimer l'ancien champ platform
          platform: undefined
        }))
      })),
      addItem: (item) =>
        set((state) => {
          const existingItem = state.items.find((i) => i.service_id === item.service_id)
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.service_id === item.service_id
                  ? { ...i, quantity: item.quantity, total_usd: item.total_usd, total_cdf: item.total_cdf }
                  : i,
              ),
            }
          }
          return { items: [...state.items, item] }
        }),
      removeItem: (service_id) =>
        set((state) => ({
          items: state.items.filter((item) => item.service_id !== service_id),
        })),
      updateQuantity: (service_id, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.service_id === service_id
              ? {
                  ...item,
                  quantity,
                  total_usd: item.price_usd * quantity,
                  total_cdf: item.price_cdf * quantity,
                }
              : item,
          ),
        })),
      clearCart: () => set({ items: [] }),
      getTotalUSD: () => get().items.reduce((sum, item) => sum + item.total_usd, 0),
      getTotalCDF: () => get().items.reduce((sum, item) => sum + item.total_cdf, 0),
      // Initialisation avec migration automatique
      initialize: () => {
        const state = get()
        if (state.items.some(item => item.platform && !item.platform_id)) {
          state.migrateItems()
        }
      },
    }),
    {
      name: "okit-boost-cart",
    },
  ),
)
