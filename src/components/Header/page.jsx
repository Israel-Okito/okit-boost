"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Menu, X, ShoppingCart, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/useCart"
import { createClient } from "@/utils/supabase/client" // ton client Supabase

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [session, setSession] = useState(null)
  const { items } = useCart()
  const supabase = createClient()

  // Récupérer la session à l'initialisation
  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
      console.log("Session récupérée :", data.session)
    }

    fetchSession()

    // Abonnement au changement d'état de session
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      console.log("Session changée :", session)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/connexion"
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-yellow-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">OB</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Okit-Boost</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {/* ... tes liens ... */}
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <Link href="/caisse" className="relative">
              <Button variant="outline" size="sm">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Panier
                {items.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {items.length}
                  </span>
                )}
              </Button>
            </Link>

            {session ? (
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </Button>
            ) : (
              <Link href="/connexion">
                <Button variant="outline" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  Connexion
                </Button>
              </Link>
            )}

            {/* Mobile menu button */}
            <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
