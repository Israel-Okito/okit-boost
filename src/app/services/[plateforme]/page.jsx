"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { ShoppingCart, AlertCircle, Loader2 } from "lucide-react"
import { useCart } from "@/hooks/useCart"
import { toast } from "sonner"
import { useAuth } from "@/lib/hooks/useAuth"
import Image from "next/image"

export default function PlatformPage() {
  const params = useParams()
  
  const { user } = useAuth()
  const { addItem } = useCart()
  const platformId = params?.plateforme

  // États
  const [platform, setPlatform] = useState(null)
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedService, setSelectedService] = useState(null)
  const [targetLink, setTargetLink] = useState("")
  const [quantity, setQuantity] = useState(100)
  const [currency, setCurrency] = useState("CDF")

  // Fetch des données
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/services/${platformId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Plateforme non trouvée')
          } else if (response.status === 401) {
            setError('Vous devez être connecté')
          } else {
            setError('Erreur lors du chargement des services')
          }
          return
        }

        const data = await response.json()
        setPlatform(data.platform)
        setServices(data.services)

      } catch (err) {
        console.error('Fetch error:', err)
        setError('Erreur de connexion au serveur')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [platformId, user])

  const handleAddToCart = (service) => {
    if (!targetLink.trim()) {
      toast.error("Veuillez entrer un lien cible", {
        description: "Le lien est requis pour traiter votre commande"
      })
      return
    }

    const total_usd = service.price_usd * quantity
    const total_cdf = service.price_cdf * quantity

    addItem({
      service_id: service.id,
      service_name: service.name,
      platform: service.platform_id,
      target_link: targetLink,
      quantity,
      price_usd: service.price_usd,
      price_cdf: service.price_cdf,
      total_usd,
      total_cdf,
    })

    toast.success("Ajouté au panier", {
      description: `${service.name} ajouté avec succès`
    })
    
    // Reset form
    setTargetLink("")
    setQuantity(100)
    setSelectedService(null)
  }

  // Loading state
  if (loading) {
    return (
        <div className="max-w-4xl mx-auto px-4 py-20">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-gray-600">Chargement des services...</p>
          </div>
        </div>
    )
  }

  // Error state
  if (error) {
    return (
     
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="flex flex-col items-center space-y-4">
            <AlertCircle className="w-16 h-16 text-red-500" />
            <h1 className="text-2xl font-bold text-red-600">Erreur</h1>
            <p className="text-gray-600">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Réessayer
            </Button>
          </div>
        </div>
    )
  }

  // No platform found
  if (!platform) {
    return (
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-red-600">Plateforme non trouvée</h1>
        </div>

    )
  }

  return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div
              className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center text-4xl shadow-lg"
              style={{
                background: platform.color_from && platform.color_to 
                  ? `linear-gradient(135deg, ${platform.color_from}, ${platform.color_to})`
                  : '#3B82F6'
              }}
            >
                      {platform.icon_url.toLowerCase() === "facebook" && (
                            <Image src="/facebook.webp" alt={platform.name} width={32} height={32} className="object-contain filter " />
                          )}
                          {platform.icon_url.toLowerCase() === "instagram" && (
                            <Image src="/instagram.webp" alt={platform.name} width={32} height={32} className="object-contain filter " />
                          )}
                          {platform.icon_url.toLowerCase() === "tiktok" && (
                            <Image src="/tiktok.webp" alt={platform.name} width={32} height={32} className="object-contain filter " />
                          )}
                          {platform.icon_url.toLowerCase() === "youtube" && (
                            <Image src="/youtube.webp" alt={platform.name} width={32} height={32} className="object-contain filter " />
                          )}
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Services {platform.name}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {platform.description}
            </p>
          </div>

          {/* Currency Toggle */}
          <div className="flex justify-center mb-8">
            <div className="bg-white border border-gray-200 p-1 rounded-lg shadow-sm">
              <button
                onClick={() => setCurrency("CDF")}
                className={`px-6 py-2 rounded-md transition-all duration-200 font-medium ${
                  currency === "CDF" 
                    ? "bg-blue-600 text-white shadow-sm" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                Prix en CDF
              </button>
              <button
                onClick={() => setCurrency("USD")}
                className={`px-6 py-2 rounded-md transition-all duration-200 font-medium ${
                  currency === "USD" 
                    ? "bg-blue-600 text-white shadow-sm" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                Prix en USD
              </button>
            </div>
          </div>

          {/* Services Grid */}
          {services.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Aucun service disponible pour cette plateforme</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service) => (
                <Card 
                  key={service.id} 
                  className={`hover:shadow-xl transition-all duration-300 border-0 shadow-md ${
                    selectedService === service.id ? 'ring-2 ring-blue-500 shadow-lg' : ''
                  }`}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg font-semibold text-gray-900 leading-tight">
                        {service.name}
                      </CardTitle>
                      <Badge 
                        variant="secondary" 
                        className="ml-2 bg-blue-100 text-blue-800 border-blue-200"
                      >
                        {service.category}
                      </Badge>
                    </div>
                    <CardDescription className="text-gray-600 leading-relaxed">
                      {service.description}
                    </CardDescription>
                    
                    {/* Service Details */}
                    <div className="flex items-center justify-between text-sm text-gray-500 pt-2">
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        {service.quality}
                      </span>
                      <span>{service.delivery_time}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-5">
                    {/* Price Display */}
                    <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                      <div className="text-3xl font-bold text-blue-600">
                        {currency === "CDF" 
                          ? `${service.price_cdf.toLocaleString()} CDF` 
                          : `$${parseFloat(service.price_usd).toFixed(2)}`
                        }
                      </div>
                      <div className="text-sm text-blue-600 opacity-75 mt-1">par unité</div>
                    </div>

                    {/* Target Link Input */}
                    <div className="space-y-2">
                      <Label htmlFor={`link-${service.id}`} className="text-sm font-medium text-gray-700">
                        Lien cible *
                      </Label>
                      <Input
                        id={`link-${service.id}`}
                        placeholder={`Lien ${platform.name} (profil, vidéo, etc.)`}
                        value={selectedService === service.id ? targetLink : ""}
                        onChange={(e) => {
                          setSelectedService(service.id)
                          setTargetLink(e.target.value)
                        }}
                        onFocus={() => setSelectedService(service.id)}
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    {/* Quantity Selector */}
                    {selectedService === service.id && (
                      <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                        <Label className="text-sm font-medium text-gray-700">
                          Quantité: {quantity.toLocaleString()}
                        </Label>
                        <Slider
                          value={[quantity]}
                          onValueChange={(value) => setQuantity(value[0])}
                          max={service.max_quantity}
                          min={service.min_quantity}
                          step={service.min_quantity}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Min: {service.min_quantity.toLocaleString()}</span>
                          <span>Max: {service.max_quantity.toLocaleString()}</span>
                        </div>
                      </div>
                    )}

                    {/* Total Price */}
                    {selectedService === service.id && (
                      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-700">
                            Total:{" "}
                            {currency === "CDF"
                              ? `${(service.price_cdf * quantity).toLocaleString()} CDF`
                              : `$${(parseFloat(service.price_usd) * quantity).toFixed(2)}`}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Add to Cart Button */}
                    <Button
                      onClick={() => handleAddToCart(service)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 transition-colors duration-200"
                      disabled={selectedService !== service.id || !targetLink.trim()}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Ajouter au panier
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
  )
}