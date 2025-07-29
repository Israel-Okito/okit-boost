"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { ShoppingCart } from "lucide-react"
import { mockServices, platforms } from "@/data/services"
import { useCart } from "@/hooks/useCart"
import { toast } from "sonner"

export default function PlatformPage() {
  const params = useParams()
  const { addItem } = useCart()
  const platformId = params.plateforme 

  const platform = platforms.find((p) => p.id === platformId)
  const services = mockServices.filter((s) => s.platform === platformId)

  const [selectedService, setSelectedService] = useState(null)
  const [targetLink, setTargetLink] = useState("")
  const [quantity, setQuantity] = useState(100)
  const [currency, setCurrency] = useState("CDF")

  if (!platform) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-red-600">Plateforme non trouvée</h1>
      </div>
    )
  }

  const handleAddToCart = (service) => {
    if (!targetLink.trim()) {
 
      toast.custom((t) => (
        <div className="bg-red-600 text-white p-2 rounded-lg shadow-lg">
          <strong className="text-lg">Erreur</strong>
          <div>Veuillez entrer un lien cible</div>
        </div>
      ));
      return
    }

    const total_usd = service.price_usd * quantity
    const total_cdf = service.price_cdf * quantity

    addItem({
      service_id: service.id,
      service_name: service.name,
      platform: service.platform,
      target_link: targetLink,
      quantity,
      price_usd: service.price_usd,
      price_cdf: service.price_cdf,
      total_usd,
      total_cdf,
    })

    toast.custom((t) => (
      <div className="bg-green-600 text-white p-2 rounded-lg shadow-lg">
        <strong className="text-lg">Ajouté au panier</strong>
        <div>{service.name} ajouté avec succès</div>
      </div>
    ));
    
    // Reset form
    setTargetLink("")
    setQuantity(100)
    setSelectedService(null)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div
          className={`w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r ${platform.color} flex items-center justify-center text-4xl`}
        >
          {platform.icon}
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Services {platform.name}</h1>
        <p className="text-xl text-gray-600">{platform.description}</p>
      </div>

      {/* Currency Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setCurrency("CDF")}
            className={`px-4 py-2 rounded-md transition-colors ${
              currency === "CDF" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Prix en CDF
          </button>
          <button
            onClick={() => setCurrency("USD")}
            className={`px-4 py-2 rounded-md transition-colors ${
              currency === "USD" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Prix en USD
          </button>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service) => (
          <Card key={service.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{service.name}</CardTitle>
                <Badge variant="secondary">{service.category}</Badge>
              </div>
              <CardDescription>{service.description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Price Display */}
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {currency === "CDF" ? `${service.price_cdf} CDF` : `$${service.price_usd}`}
                </div>
                <div className="text-sm text-gray-600">par unité</div>
              </div>

              {/* Target Link Input */}
              <div className="space-y-2">
                <Label htmlFor={`link-${service.id}`}>Lien cible *</Label>
                <Input
                  id={`link-${service.id}`}
                  placeholder={`Lien ${platform.name} (profil, vidéo, etc.)`}
                  value={selectedService === service.id ? targetLink : ""}
                  onChange={(e) => {
                    setSelectedService(service.id)
                    setTargetLink(e.target.value)
                  }}
                  onFocus={() => setSelectedService(service.id)}
                />
              </div>

              {/* Quantity Selector */}
              {selectedService === service.id && (
                <div className="space-y-2">
                  <Label>Quantité: {quantity.toLocaleString()}</Label>
                  <Slider
                    value={[quantity]}
                    onValueChange={(value) => setQuantity(value[0])}
                    max={service.max_quantity}
                    min={service.min_quantity}
                    step={service.min_quantity}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Min: {service.min_quantity.toLocaleString()}</span>
                    <span>Max: {service.max_quantity.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Total Price */}
              {selectedService === service.id && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">
                      Total:{" "}
                      {currency === "CDF"
                        ? `${(service.price_cdf * quantity).toLocaleString()} CDF`
                        : `$${(service.price_usd * quantity).toFixed(2)}`}
                    </div>
                  </div>
                </div>
              )}

              {/* Add to Cart Button */}
              <Button
                onClick={() => handleAddToCart(service)}
                className="w-full"
                disabled={selectedService !== service.id || !targetLink.trim()}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Ajouter au panier
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
