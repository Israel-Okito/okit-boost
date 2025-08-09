"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ShoppingCart, AlertCircle, Loader2, Plus, Minus } from "lucide-react"
import { useCart } from "@/hooks/useCart"
import { toast } from "sonner"
import { useAuth } from "@/lib/hooks/useAuth"
import Image from "next/image"
import Head from "next/head"

// États de chargement
const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
}

// Skeleton Components
function ServiceCardSkeleton() {
  return (
    <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-16 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
          <Skeleton className="h-8 w-32 mx-auto mb-1" />
          <Skeleton className="h-3 w-16 mx-auto" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  )
}

function HeaderSkeleton() {
  return (
    <header className="text-center mb-12">
      <Skeleton className="w-20 h-20 rounded-full mx-auto mb-6" />
      <Skeleton className="h-10 w-96 mx-auto mb-4" />
      <Skeleton className="h-6 w-80 mx-auto" />
    </header>
  )
}

export default function PlatformPage() {
  const params = useParams()
  const { user } = useAuth()
  const { addItem } = useCart()
  const platformId = params?.plateforme

  // États consolidés
  const [state, setState] = useState({
    platform: null,
    services: [],
    loadingState: LOADING_STATES.IDLE,
    error: null
  })

  // États locaux pour les formulaires - SOLUTION: Initialisation avec Map pour éviter undefined
  const [formStates, setFormStates] = useState(new Map())
  const [currency, setCurrency] = useState("CDF")

  // Mémoriser les données pour éviter les re-renders inutiles
  const memoizedServices = useMemo(() => state.services || [], [state.services])
  const memoizedPlatform = useMemo(() => state.platform, [state.platform])

  // SOLUTION: Fonction sécurisée pour obtenir l'état du formulaire
  const getFormState = useCallback((serviceId) => {
    if (!serviceId) return { targetLink: '', quantity: 100 }
    
    const existing = formStates.get(serviceId)
    if (existing) return existing
    
    // Valeurs par défaut sécurisées
    const defaultState = { targetLink: '', quantity: 100 }
    
    // Mettre à jour le state avec les valeurs par défaut
    setFormStates(prev => new Map(prev).set(serviceId, defaultState))
    
    return defaultState
  }, [formStates])

  // SOLUTION: Fonction pour mettre à jour l'état du formulaire de manière sécurisée
  const updateFormState = useCallback((serviceId, updates) => {
    if (!serviceId) return
    
    setFormStates(prev => {
      const newMap = new Map(prev)
      const current = newMap.get(serviceId) || { targetLink: '', quantity: 100 }
      newMap.set(serviceId, { ...current, ...updates })
      return newMap
    })
  }, [])

  // Une seule fonction de fetch optimisée
  const fetchPlatformData = async () => {
    if (!user || !platformId || state.loadingState === LOADING_STATES.LOADING) {
      return
    }

    setState(prev => ({ ...prev, loadingState: LOADING_STATES.LOADING, error: null }))

    try {
      const response = await fetch(`/api/services/${platformId}`, {
        headers: {
          'Cache-Control': 'max-age=300',
        },
      })
      
      if (!response.ok) {
        let errorMessage = 'Erreur lors du chargement des services'
        if (response.status === 404) errorMessage = 'Plateforme non trouvée'
        else if (response.status === 401) errorMessage = 'Vous devez être connecté'
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      setState(prev => ({
        ...prev,
        platform: data.platform || null,
        services: data.services || [],
        loadingState: LOADING_STATES.SUCCESS,
        error: null
      }))

    } catch (err) {
      console.error('Fetch error:', err)
      setState(prev => ({
        ...prev,
        loadingState: LOADING_STATES.ERROR,
        error: err.message || 'Une erreur est survenue'
      }))
    }
  }

  // Effect optimisé avec dépendances précises
  useEffect(() => {
    if (user && platformId && state.loadingState === LOADING_STATES.IDLE) {
      fetchPlatformData()
    }
  }, [user, platformId])

  // SOLUTION: Gestion de la quantité avec validation robuste
  const handleQuantityChange = useCallback((serviceId, value, service) => {
    if (!serviceId || !service) return
    
    // Conversion sécurisée en nombre
    let numValue = parseInt(value, 10)
    
    // Si la conversion échoue ou valeur invalide, utiliser min_quantity
    if (isNaN(numValue) || numValue < 1) {
      numValue = service.min_quantity || 1
    }
    
    // Clamp la valeur entre min et max avec fallbacks
    const minQty = service.min_quantity || 1
    const maxQty = service.max_quantity || 1000000
    const clampedValue = Math.max(minQty, Math.min(maxQty, numValue))
    
    updateFormState(serviceId, { quantity: clampedValue })
  }, [updateFormState])

  const adjustQuantity = useCallback((serviceId, delta, service) => {
    if (!serviceId || !service) return
    
    const currentState = getFormState(serviceId)
    const currentQuantity = currentState.quantity || service.min_quantity || 100
    const newQuantity = currentQuantity + delta
    
    handleQuantityChange(serviceId, newQuantity.toString(), service)
  }, [getFormState, handleQuantityChange])

  const handleAddToCart = useCallback((service) => {
    if (!service?.id) return
    
    const formState = getFormState(service.id)
    
    if (!formState.targetLink?.trim()) {
      toast.error("Veuillez entrer un lien cible Le lien est requis pour traiter votre commande")
      return
    }

    // Calculs sécurisés avec fallbacks
    const quantity = formState.quantity || 1
    const priceUsd = service.price_usd || 0
    const priceCdf = service.price_cdf || 0
    
    const total_usd = priceUsd * quantity
    const total_cdf = priceCdf * quantity

    addItem({
      service_id: service.id,
      service_name: service.name || 'Service',
      platform: service.platform_id || 'unknown',
      target_link: formState.targetLink,
      quantity: quantity,
      price_usd: priceUsd,
      price_cdf: priceCdf,
      total_usd,
      total_cdf,
    })

    toast.success("Ajouté au panier",`${service.name || 'Service'} ajouté avec succès`
    )
    
    // Reset du formulaire
    updateFormState(service.id, { targetLink: '', quantity: service.min_quantity || 100 })
  }, [getFormState, addItem, updateFormState])

  // SEO Meta données dynamiques
  const seoData = useMemo(() => {
    if (!memoizedPlatform) return {
      title: "Chargement des services...",
      description: "Chargement des services SMM en cours...",
      noindex: true
    }
    
    return {
      title: `Services SMM ${memoizedPlatform.name} - Boostez votre présence | Okit-Boost`,
      description: `Découvrez nos services SMM premium pour ${memoizedPlatform.name}. Followers, likes, vues authentiques. Livraison rapide, paiement Mobile Money, support 24/7.`,
      keywords: `SMM ${memoizedPlatform.name}, followers ${memoizedPlatform.name}, likes ${memoizedPlatform.name}, vues ${memoizedPlatform.name}, boost réseaux sociaux, Congo RDC, Mobile Money`,
      canonical: `https://okit-boost.com/services/${platformId}`,
      ogImage: `/og-images/${memoizedPlatform.id}.jpg`
    }
  }, [memoizedPlatform, platformId])

  // Loading state avec skeleton
  if (state.loadingState === LOADING_STATES.LOADING) {
    return (
      <>
        <Head>
          <title>Chargement des services...</title>
          <meta name="robots" content="noindex" />
        </Head>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <HeaderSkeleton />
            
            {/* Currency Toggle Skeleton */}
            <div className="flex justify-center mb-8">
              <Skeleton className="h-12 w-48 rounded-lg" />
            </div>

            {/* Services Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, index) => (
                <ServiceCardSkeleton key={index} />
              ))}
            </div>
          </div>
        </div>
      </>
    )
  }

  // Error state
  if (state.loadingState === LOADING_STATES.ERROR) {
    return (
      <>
        <Head>
          <title>Erreur - Services non trouvés</title>
          <meta name="robots" content="noindex" />
        </Head>
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="flex flex-col items-center space-y-4">
            <AlertCircle className="w-16 h-16 text-red-500" />
            <h1 className="text-2xl font-bold text-red-600">Erreur</h1>
            <p className="text-gray-600">{state.error}</p>
            <Button onClick={fetchPlatformData} variant="outline">
              Réessayer
            </Button>
          </div>
        </div>
      </>
    )
  }

  // No platform found
  if (!memoizedPlatform) {
    return (
      <>
        <Head>
          <title>Plateforme non trouvée - Okit-Boost</title>
          <meta name="robots" content="noindex" />
        </Head>
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-red-600">Plateforme non trouvée</h1>
        </div>
      </>
    )
  }

  // JSON-LD pour le SEO structuré
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": `Services SMM ${memoizedPlatform.name}`,
    "description": seoData.description,
    "provider": {
      "@type": "Organization",
      "name": "Okit-Boost",
      "url": "https://okit-boost.com"
    },
    "areaServed": "CD",
    "availableChannel": {
      "@type": "ServiceChannel",
      "serviceUrl": seoData.canonical
    }
  }

  return (
    <>
      <Head>
        <title>{seoData.title}</title>
        <meta name="description" content={seoData.description} />
        <meta name="keywords" content={seoData.keywords} />
        <link rel="canonical" href={seoData.canonical} />
        
        {/* Open Graph */}
        <meta property="og:title" content={seoData.title} />
        <meta property="og:description" content={seoData.description} />
        <meta property="og:image" content={seoData.ogImage} />
        <meta property="og:url" content={seoData.canonical} />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoData.title} />
        <meta name="twitter:description" content={seoData.description} />
        <meta name="twitter:image" content={seoData.ogImage} />
        
        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header SEO optimisé */}
          <header className="text-center mb-12">
            <div
              className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center text-4xl shadow-lg"
              style={{
                background: memoizedPlatform.color_from && memoizedPlatform.color_to 
                  ? `linear-gradient(135deg, ${memoizedPlatform.color_from}, ${memoizedPlatform.color_to})`
                  : '#3B82F6'
              }}
            >
              {memoizedPlatform.icon_url?.toLowerCase() === "facebook" && (
                <Image src="/facebook.webp" alt={`Services SMM ${memoizedPlatform.name}`} width={32} height={32} className="object-contain" priority />
              )}
              {memoizedPlatform.icon_url?.toLowerCase() === "instagram" && (
                <Image src="/instagram.webp" alt={`Services SMM ${memoizedPlatform.name}`} width={32} height={32} className="object-contain" priority />
              )}
              {memoizedPlatform.icon_url?.toLowerCase() === "tiktok" && (
                <Image src="/tiktok.webp" alt={`Services SMM ${memoizedPlatform.name}`} width={32} height={32} className="object-contain" priority />
              )}
              {memoizedPlatform.icon_url?.toLowerCase() === "youtube" && (
                <Image src="/youtube.webp" alt={`Services SMM ${memoizedPlatform.name}`} width={32} height={32} className="object-contain" priority />
              )}
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Services SMM {memoizedPlatform.name} - Boost Professionnel
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {memoizedPlatform.description} | Livraison rapide | Paiement Mobile Money | Support 24/7
            </p>
          </header>

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
          {memoizedServices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Aucun service disponible pour cette plateforme</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {memoizedServices.map((service) => {
                if (!service?.id) return null
                
                const formState = getFormState(service.id)
                
                return (
                  <article key={service.id} className="hover:shadow-xl transition-all duration-300 border-0 shadow-md">
                    <Card>
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg font-semibold text-gray-900 leading-tight">
                            {service.name || 'Service'}
                          </CardTitle>
                          <Badge 
                            variant="secondary" 
                            className="ml-2 bg-blue-100 text-blue-800 border-blue-200"
                          >
                            {service.category || 'Service'}
                          </Badge>
                        </div>
                        <CardDescription className="text-gray-600 leading-relaxed">
                          {service.description || 'Description du service'}
                        </CardDescription>
                        
                        {/* Service Details */}
                        <div className="flex items-center justify-between text-sm text-gray-500 pt-2">
                          <span className="flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            {service.quality || 'Standard'}
                          </span>
                          <span>{service.delivery_time || '24-48h'}</span>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-5">
                        {/* Price Display */}
                        <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                          <div className="text-3xl font-bold text-blue-600">
                            {currency === "CDF" 
                              ? `${(service.price_cdf || 0).toLocaleString()} CDF` 
                              : `$${parseFloat(service.price_usd || 0).toFixed(2)}`
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
                            placeholder={`Lien ${memoizedPlatform.name} (profil, vidéo, etc.)`}
                            value={formState.targetLink || ''} // SOLUTION: Toujours une chaîne
                            onChange={(e) => updateFormState(service.id, { targetLink: e.target.value || '' })}
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>

                        {/* Quantity Input avec contrôles */}
                        <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                          <Label className="text-sm font-medium text-gray-700">
                            Quantité: {(formState.quantity || 0).toLocaleString()} {/* SOLUTION: Protection contre undefined */}
                          </Label>
                          
                          {/* Contrôles de quantité */}
                          <div className="flex items-center space-x-4">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => adjustQuantity(service.id, -(service.min_quantity || 1), service)}
                              disabled={(formState.quantity || 0) <= (service.min_quantity || 1)}
                              className="p-2"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            
                            <Input
                              type="number"
                              value={formState.quantity || ''} // SOLUTION: Valeur contrôlée avec fallback
                              onChange={(e) => handleQuantityChange(service.id, e.target.value, service)}
                              min={service.min_quantity || 1}
                              max={service.max_quantity || 1000000}
                              step={service.min_quantity || 1}
                              className="text-center font-medium"
                            />
                            
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => adjustQuantity(service.id, (service.min_quantity || 1), service)}
                              disabled={(formState.quantity || 0) >= (service.max_quantity || 1000000)}
                              className="p-2"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Min: {(service.min_quantity || 1).toLocaleString()}</span>
                            <span>Max: {(service.max_quantity || 1000000).toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Total Price */}
                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-700">
                              Total:{" "}
                              {currency === "CDF"
                                ? `${((service.price_cdf || 0) * (formState.quantity || 0)).toLocaleString()} CDF`
                                : `$${(parseFloat(service.price_usd || 0) * (formState.quantity || 0)).toFixed(2)}`}
                            </div>
                          </div>
                        </div>

                        {/* Add to Cart Button */}
                        <Button
                          onClick={() => handleAddToCart(service)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 transition-colors duration-200"
                          disabled={!formState.targetLink?.trim()}
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Ajouter au panier
                        </Button>
                      </CardContent>
                    </Card>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}