// Modifications à apporter à src/app/caisse/page.jsx
// Ajouter l'intégration CinetPay

"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  ShoppingCart, 
  CreditCard, 
  Trash2, 
  Smartphone,
  Shield,
  Zap,
  ArrowLeft,
  Lock,
  Star,
  TrendingUp
} from "lucide-react"
import { useCart } from "@/hooks/useCart"
import { useAuth } from "@/lib/hooks/useAuth"
import { toast } from "sonner"
import { CinetPayPayment } from "@/components/payments/cinetPayPayment"

export default function CheckoutPage() {
  const router = useRouter()
  const { user, profile } = useAuth()
  const { items, removeItem, clearCart, getTotalUSD, getTotalCDF, initialize } = useCart()

  const [currency, setCurrency] = useState("CDF")

  // Migration automatique des anciens items du panier
  React.useEffect(() => {
    initialize()
  }, [initialize])

  // Debug: Fonction pour vider le panier et résoudre les problèmes de migration
  const handleClearCartForMigration = () => {
    clearCart()
    toast.success('Panier vidé - Vous pouvez maintenant ajouter de nouveaux services')
  }

  // Fonctions de gestion supprimées - seul CinetPay est utilisé maintenant

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="animate-bounce mb-6">
            <ShoppingCart className="w-20 h-20 text-blue-400 mx-auto" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Votre panier est vide</h1>
          <p className="text-lg text-gray-600 mb-8">Découvrez nos services SMM et boostez votre présence en ligne</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={() => router.push("/services")}
              className="flex items-center space-x-2 px-6 py-3"
              size="lg"
            >
              <TrendingUp className="w-5 h-5" />
              <span>Découvrir nos services</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push("/")}
              className="flex items-center space-x-2"
              size="lg"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour à l'accueil</span>
            </Button>
          </div>

          {/* Statistiques encourageantes */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
              <div className="text-2xl font-bold text-blue-600">10K+</div>
              <div className="text-sm text-gray-600">Commandes traitées</div>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
              <div className="text-2xl font-bold text-green-600">98%</div>
              <div className="text-sm text-gray-600">Clients satisfaits</div>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
              <div className="text-2xl font-bold text-purple-600">24/7</div>
              <div className="text-sm text-gray-600">Support disponible</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-2 sm:px-6 lg:px-8 py-8">
        {/* Header avec breadcrumb */}
        <div className="mb-8">
          <div className="flex items-center max-sm:flex-col justify-self-start space-x-2 text-sm text-gray-600 mb-4">
            <button 
              onClick={() => router.push("/services")}
              className="hover:text-blue-600 transition-colors flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour aux services</span>
            </button>
            <div className="flex items-center space-x-2">
              <span>•</span>
              <span className="text-gray-900 font-medium">Finaliser la commande</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center space-x-3">
                <Lock className="w-8 h-8 text-green-600" />
                <span>Paiement sécurisé</span>
              </h1>
              <p className="text-gray-600 mt-2">Complétez votre commande en toute sécurité</p>
            </div>
 
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Récapitulatif commande */}
        <div>
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center max-sm:flex-col py-2">
              <div className="flex items-center max-sm:text-sm">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Récapitulatif de la commande
              </div>
                <Badge variant="secondary" className="ml-auto bg-white/20 text-white">
                  {items.length} service{items.length > 1 ? 's' : ''}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Currency Toggle */}
              <div className="flex justify-center mb-6">
                <div className="bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setCurrency("CDF")}
                    className={`px-3 py-1 rounded-md text-sm transition-colors ${
                      currency === "CDF" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    CDF
                  </button>
                  <button
                    onClick={() => setCurrency("USD")}
                    className={`px-3 py-1 rounded-md text-sm transition-colors ${
                      currency === "USD" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    USD
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.service_id} className="group">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 space-y-3 sm:space-y-0">
                      <div className="flex-1">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                              {index + 1}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900">{item.service_name}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="text-xs capitalize">
                                {item.platform_id || item.platform}
                              </Badge>
                              <Star className="w-3 h-3 text-yellow-500 fill-current" />
                              <span className="text-xs text-gray-500">Service premium</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">Quantité: {item.quantity.toLocaleString()}</p>
                            <div className="text-xs text-gray-500 break-all">
                              <p className="line-clamp-2 leading-relaxed" title={item.target_link}>
                                <span className="font-medium">Lien:</span> {item.target_link}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start space-x-2 sm:space-x-0 sm:space-y-2 sm:text-right">
                        <div className="font-bold text-lg text-blue-600">
                          {currency === "CDF"
                            ? `${item.total_cdf.toLocaleString()} CDF`
                            : `$${item.total_usd.toFixed(2)}`}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            removeItem(item.service_id)
                            toast.success('Service retiré du panier')
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300 transition-all flex-shrink-0"
                          title="Retirer du panier"
                        >
                          <Trash2 className="w-4 h-4" />
                          {/* <span className="ml-1 sm:hidden">Supprimer</span> */}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-2 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="text-gray-700">
                    <div className="text-sm font-medium">Total à payer</div>
                    <div className="text-xs text-gray-500">Frais inclus</div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {currency === "CDF" ? `${getTotalCDF().toLocaleString()} CDF` : `$${getTotalUSD().toFixed(2)}`}
                    </div>
                    <div className="text-sm text-gray-600">
                      {currency === "CDF" ? `≈ $${getTotalUSD().toFixed(2)}` : `≈ ${getTotalCDF().toLocaleString()} CDF`}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Formulaire de paiement */}
        <div>
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Informations de paiement
            
              </CardTitle>
              <CardDescription className="text-white/90">
                Complétez vos informations pour finaliser la commande
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Interface CinetPay directe */}
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Smartphone className="w-6 h-6 text-blue-600" />
                    <span className="text-lg font-semibold">Paiement Mobile Money</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 max-lg:hidden">
                      <Zap className="w-3 h-3 mr-1" />
                      Instantané
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Payez en toute sécurité avec Orange Money, Airtel Money, etc.
                  </p>
                  <div className="flex items-center justify-center mt-2 space-x-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-green-600">Sécurisé par CinetPay</span>
                  </div>
                </div>

                <CinetPayPayment 
                  cartItems={items}
                  currency={currency}
                  onSuccess={() => {
                    clearCart()
                    router.push('/mon-compte')
                  }}
                  onError={(error) => {
                    console.error('Erreur CinetPay:', error)
                    toast.error('Erreur lors du paiement')
                  }}
                />

                {/* Informations sécurité */}
                <div className="text-xs text-gray-500 text-center space-y-2 mt-6">
                  <div className="flex items-center justify-center space-x-2">
                    <Shield className="w-4 h-4" />
                    <span>Vos informations sont sécurisées et ne seront pas partagées avec des tiers.</span>
                  </div>
                  <p className="text-blue-600">
                    CinetPay est un processeur de paiement certifié et sécurisé pour l'Afrique.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </div>
  )
}