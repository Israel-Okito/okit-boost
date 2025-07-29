"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"



export const useCart = create()(
  persist(
    (set, get) => ({
      items: [],
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
    }),
    {
      name: "okit-boost-cart",
    },
  ),
)
