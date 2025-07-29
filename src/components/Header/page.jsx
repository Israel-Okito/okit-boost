"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X, ShoppingCart, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/useCart"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { items } = useCart()

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
            <Link href="/" className="text-gray-700 hover:text-blue-600 transition-colors">
              Accueil
            </Link>
            <Link href="/acheter/tiktok" className="text-gray-700 hover:text-blue-600 transition-colors">
              TikTok
            </Link>
            <Link href="/acheter/instagram" className="text-gray-700 hover:text-blue-600 transition-colors">
              Instagram
            </Link>
            <Link href="/acheter/youtube" className="text-gray-700 hover:text-blue-600 transition-colors">
              YouTube
            </Link>
            <Link href="/acheter/facebook" className="text-gray-700 hover:text-blue-600 transition-colors">
              Facebook
            </Link>
            <Link href="/formulaire-dessai" className="text-gray-700 hover:text-blue-600 transition-colors">
              Essai Gratuit
            </Link>
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
            <Link href="/login">
              <Button variant="outline" size="sm">
                <User className="w-4 h-4 mr-2" />
                Connexion
              </Button>
            </Link>

            {/* Mobile menu button */}
            <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-2">
              <Link href="/" className="py-2 text-gray-700 hover:text-blue-600">
                Accueil
              </Link>
              <Link href="/acheter/tiktok" className="py-2 text-gray-700 hover:text-blue-600">
                TikTok
              </Link>
              <Link href="/acheter/instagram" className="py-2 text-gray-700 hover:text-blue-600">
                Instagram
              </Link>
              <Link href="/acheter/youtube" className="py-2 text-gray-700 hover:text-blue-600">
                YouTube
              </Link>
              <Link href="/formulaire-dessai" className="py-2 text-gray-700 hover:text-blue-600">
                Essai Gratuit
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
