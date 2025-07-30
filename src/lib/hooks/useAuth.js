"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Récupérer la session initiale
    getInitialSession()

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
     
        if (session?.user) {
          setUser(session.user)
          await fetchProfile()
        } else {
          setUser(null)
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function getInitialSession() {
    try {
      setLoading(true)
      
      // Vérifier s'il y a une session côté client d'abord
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        setUser(session.user)
        await fetchProfile()
      } else {
        console.log('No initial session found')
      }
    } catch (error) {
      console.error('Error getting initial session:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchProfile() {
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'GET',
        credentials: 'include', // Important: inclure les cookies
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setProfile(data.profile)
        // Mettre à jour l'utilisateur avec les dernières données
        if (data.user) {
          setUser(data.user)
        }
      } else {
        console.error('Profile API error:', data.error)
        // Si l'erreur est 401, l'utilisateur n'est pas authentifié
        if (response.status === 401) {
          setUser(null)
          setProfile(null)
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  async function signOut() {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const value = {
    user,
    profile,
    loading,
    signOut,
    refreshProfile: fetchProfile,
    isAdmin: profile?.role === 'admin'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

