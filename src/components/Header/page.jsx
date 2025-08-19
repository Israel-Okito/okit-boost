"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X, ShoppingCart, User, LogOut, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/useCart"
import { useAuth } from "@/lib/hooks/useAuth"
import Image from "next/image"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, profile, signOut, isAdmin, loading } = useAuth()
  const { items } = useCart()

  const handleLogout = async () => {
    await signOut()
    window.location.href = "/"
  }

  return (
    <header className="bg-gradient-to-r bg-[#210238] via-purple-950 to-yellow-500  shadow-sm sticky top-0 z-40 ">
      <div className="max-w-7xl mx-auto px-1 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center  ">
           <Image src={"/logo.webp"} alt="okit boost" width={80} height={80}/>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center text-white hover:text-white/90  space-x-8">
            <Link 
              href="/services" 
              className="font-medium transition-colors"
            >
              Services
            </Link>
            <Link 
              href="/formulaire-dessai" 
              className="font-medium transition-colors"
            >
              Essai gratuit
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4 ">
            <Link href="/caisse" className="relative ">
              <Button variant="outline" size="sm" className="cursor-pointer">
                <ShoppingCart className="w-4 h-4 " />
               <span className="hidden sm:inline"> Panier</span>
                {items.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {items.length}
                  </span>
                )}
              </Button>
            </Link>

            {loading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            ) : user ? (
              <div className="flex items-center space-x-2">
                {isAdmin && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm" className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      Admin
                    </Button>
                  </Link>
                )}
                <Link href="/mon-compte">
                  <Button variant="outline" size="sm">
                    <User className="w-4 h-4 " />
                    <span className="hidden sm:inline cursor-pointer">
                      {profile?.full_name || user.email?.split('@')[0] || 'Mon compte'}
                    </span>
                    {/* <span className="sm:hidden">Compte</span> */}
                  </Button>
                </Link>
                <Button onClick={handleLogout} variant="outline" size="sm" className="cursor-pointer">
                  <LogOut className="w-4 h-4 " />
                </Button>
              </div>
            ) : (
              <Link href="/connexion">
                <Button variant="outline" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline cursor-pointer">Connexion</span>
                  <span className="sm:hidden cursor-pointer">Login</span>
                </Button>
              </Link>
            )}

            {/* Mobile menu button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="md:hidden border " 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
              <Link
                href="/services"
                className="block px-3 py-2 text-white hover:text-gray-900 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Services
              </Link>
              <Link
                href="/formulaire-dessai"
                className="block px-3 py-2 text-white hover:text-gray-900 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Essai gratuit
              </Link>
              
              {user && (
                <>
                  <Link
                    href="/mon-compte"
                    className="block px-3 py-2 text-white hover:text-gray-900 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Mon compte
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="block px-3 py-2 text-white hover:text-gray-900 font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Administration
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsMenuOpen(false)
                    }}
                    className="block w-full text-left px-3 py-2 text-white hover:text-gray-900 font-medium"
                  >
                    Déconnexion
                  </button>
                </>
              )}
              
              {!user && (
                <Link
                  href="/connexion"
                  className="block px-3 py-2 text-white hover:text-gray-900 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Connexion
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}