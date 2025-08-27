"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useLazyData, LazySection } from "@/lib/performance/lazyLoading"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, 
  Filter, 
  Eye, 
  Users, 
  Heart, 
  Star,
  ShoppingCart,
  TrendingUp,
  Clock,
  Shield,
  Zap,
  Info,
  ArrowRight
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCart } from "@/hooks/useCart"
import { useAuth } from "@/lib/hooks/useAuth"
import { toast } from "sonner"


// Table Header Component - Hidden on mobile
function ServiceTableHeader() {
  return (
    <div className="hidden lg:grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b font-semibold text-sm text-gray-700">
      <div className="col-span-1 text-center">ID</div>
      <div className="col-span-4">Service</div>
      <div className="col-span-2 text-center">Tarif pour 1000</div>
      <div className="col-span-1 text-center">Min</div>
      <div className="col-span-1 text-center">Max</div>
      <div className="col-span-3">Description</div>
    </div>
  )
}

// Service Row Component
function ServiceRow({ service, index, onAddToCart, onViewDetails }) {
  const [quantity, setQuantity] = useState(service.min_quantity || 100)
  const [targetLink, setTargetLink] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [urlError, setUrlError] = useState('')

  const handleQuantityChange = (value) => {
    const numValue = parseInt(value) || service.min_quantity || 100
    const clampedValue = Math.max(
      service.min_quantity || 1,
      Math.min(service.max_quantity || 1000000, numValue)
    )
    setQuantity(clampedValue)
  }

  const validateURL = (url) => {
    if (!url.trim()) {
      return { valid: false, message: 'Veuillez entrer un lien cible' }
    }

    try {
      const urlObj = new URL(url.trim())
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return { 
          valid: false, 
          message: 'L\'URL doit commencer par http:// ou https://' 
        }
      }
      return { valid: true, url: urlObj.href }
    } catch {
      return { 
        valid: false, 
        message: 'Format d\'URL invalide. Exemple: https://www.instagram.com/username' 
      }
    }
  }

  const handleAddToCart = () => {
    const validation = validateURL(targetLink)
    
    if (!validation.valid) {
      toast.error(validation.message)
      return
    }

    onAddToCart({
      service_id: service.id,
      service_name: service.name,
      platform_id: service.platform_id,
      target_link: validation.url, // Utiliser l'URL validée
      quantity: quantity,
      price_usd: service.price_usd,
      price_cdf: service.price_cdf,
      total_usd: (service.price_usd || 0) * quantity,
      total_cdf: (service.price_cdf || 0) * quantity,
    })

    // Reset form
    setTargetLink('')
    setQuantity(service.min_quantity || 100)
    setShowForm(false)
    toast.success(`${service.name} ajouté au panier`)
  }

  const getQualityBadge = (quality) => {
    const badges = {
      'high': { label: 'Premium', color: 'bg-green-100 text-green-800 border-green-300' },
      'medium': { label: 'Standard', color: 'bg-blue-100 text-blue-800 border-blue-300' },
      'low': { label: 'Basique', color: 'bg-orange-100 text-orange-800 border-orange-300' }
    }
    const badge = badges[quality?.toLowerCase()] || badges.medium
    return <Badge className={`${badge.color} text-xs`}>{badge.label}</Badge>
  }

  const getSpeedIcon = (speed) => {
    if (speed?.includes('instant') || speed?.includes('rapide')) {
      return <Zap className="w-4 h-4 text-yellow-500" />
    }
    return <Clock className="w-4 h-4 text-gray-500" />
  }

  return (
    <>
      {/* Version Desktop - Table Row */}
      <div className={`hidden lg:grid grid-cols-12 gap-4 p-4 border-b hover:bg-gray-50 transition-colors ${
        index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
      }`}>
        {/* ID */}
        <div className="col-span-1 text-center text-sm font-mono text-gray-600">
          {service.id || index + 1}
        </div>

        {/* Service Info */}
        <div className="col-span-4 space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight">
              {service.name}
            </h3>
            <div className="flex items-center space-x-1">
              {getQualityBadge(service.quality)}
              {getSpeedIcon(service.speed)}
            </div>
          </div>
          
          <div className="flex items-center space-x-3 text-xs text-gray-500">
            <span className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
              {service.delivery_time || '24-48h'}
            </span>
            {service.refill_enabled && (
              <span className="flex items-center">
                <Shield className="w-3 h-3 mr-1" />
                Refill {service.refill_days || '30'}j
              </span>
            )}
          </div>

          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowForm(!showForm)}
              className="text-xs"
            >
              <ShoppingCart className="w-3 h-3 mr-1" />
              Commander
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onViewDetails(service)}
              className="text-xs"
            >
              <Info className="w-3 h-3 mr-1" />
              Voir
            </Button>
          </div>
        </div>

        {/* Price */}
        <div className="col-span-2 text-center">
          <div className="space-y-1">
            <div className="text-lg font-bold text-blue-600">
              {(service.price_cdf || 0).toLocaleString()} CDF
            </div>
            <div className="text-xs text-gray-500">
              ${(service.price_usd || 0).toFixed(3)}
            </div>
          </div>
        </div>

        {/* Min */}
        <div className="col-span-1 text-center text-sm text-gray-600">
          {(service.min_quantity || 0).toLocaleString()}
        </div>

        {/* Max */}
        <div className="col-span-1 text-center text-sm text-gray-600">
          {(service.max_quantity || 0).toLocaleString()}
        </div>

        {/* Description */}
        <div className="col-span-3">
          <p className="text-sm text-gray-600 leading-relaxed">
            {service.description || 'Service de qualité pour booster votre présence'}
          </p>
          
          {service.features && (
            <div className="mt-2 flex flex-wrap gap-1">
              {service.features.slice(0, 3).map((feature, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Order Form */}
      {showForm && (
        <div className="col-span-12 bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lien cible *
              </label>
              <Input
                placeholder={`https://www.${service.platform_id || 'social'}.com/username`}
                value={targetLink}
                onChange={(e) => {
                  const value = e.target.value
                  setTargetLink(value)
                  
                  // Validation en temps réel
                  if (value.trim()) {
                    const validation = validateURL(value)
                    setUrlError(validation.valid ? '' : validation.message)
                  } else {
                    setUrlError('')
                  }
                }}
                className={`text-sm ${urlError ? 'border-red-500' : targetLink && !urlError ? 'border-green-500' : ''}`}
              />
              {urlError && (
                <p className="text-xs text-red-500 mt-1">{urlError}</p>
              )}
              {targetLink && !urlError && (
                <p className="text-xs text-green-600 mt-1">✓ URL valide</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantité: {quantity.toLocaleString()}
              </label>
              <Input
                type="number"
                min={service.min_quantity || 1}
                max={service.max_quantity || 1000000}
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="flex items-end space-x-2">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700 mb-1">
                  Total: {((service.price_cdf || 0) * quantity).toLocaleString()} CDF
                </div>
                <Button
                  onClick={handleAddToCart}
                  disabled={!targetLink.trim()}
                  className="w-full"
                  size="sm"
                >
                  Ajouter au panier
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Version Mobile - Card */}
      <Card className="lg:hidden mb-4">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">
                {service.name}
              </h3>
              <div className="flex items-center space-x-2 mb-2">
                {getQualityBadge(service.quality)}
                {getSpeedIcon(service.speed)}
                <span className="text-xs text-gray-500">ID: {service.id || index + 1}</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-3 text-xs">
            <div>
              <span className="text-gray-600">Prix (1000):</span>
              <div className="font-semibold text-blue-600">
                {service.price_cdf ? `${service.price_cdf.toLocaleString()} FC` : 'Sur devis'}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Délai:</span>
              <div className="font-semibold text-green-600">
                {service.delivery_time || '24-48h'}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Min:</span>
              <div className="font-semibold">{service.min_quantity?.toLocaleString() || 'N/A'}</div>
            </div>
            <div>
              <span className="text-gray-600">Max:</span>
              <div className="font-semibold">{service.max_quantity?.toLocaleString() || 'N/A'}</div>
            </div>
          </div>

          {service.description && (
            <p className="text-xs text-gray-600 mb-3 line-clamp-2">
              {service.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              {service.refill_enabled && (
                <span className="flex items-center">
                  <Shield className="w-3 h-3 mr-1" />
                  Remplissage
                </span>
              )}
              <span className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                Actif
              </span>
            </div>
            <Button
              size="sm"
              onClick={() => setShowForm(!showForm)}
              className="text-xs px-3 py-1"
            >
              {showForm ? 'Annuler' : 'Commander'}
            </Button>
          </div>

          {/* Mobile Order Form */}
          {showForm && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Lien cible *
                  </label>
                  <Input
                    placeholder={`Lien de votre ${service.platform_id || 'profil'}`}
                    value={targetLink}
                    onChange={(e) => setTargetLink(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Quantité
                  </label>
                  <Input
                    type="number"
                    min={service.min_quantity || 100}
                    max={service.max_quantity || 10000}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className="text-sm"
                  />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-gray-600">
                    Total: <span className="font-semibold text-blue-600">
                      {service.price_cdf ? `${((service.price_cdf * quantity) / 1000).toLocaleString()} FC` : 'Sur devis'}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleAddToCart}
                    disabled={!targetLink}
                    className="text-xs px-4"
                  >
                    Ajouter au panier
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}

// Platform Tab Component
function PlatformServices({ platform, services, onAddToCart, onViewDetails }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name') // name, price, popularity

  const filteredServices = useMemo(() => {
    return services
      .filter(service => 
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        switch (sortBy) {
          case 'price':
            return (a.price_cdf || 0) - (b.price_cdf || 0)
          case 'popularity':
            return (b.orders_count || 0) - (a.orders_count || 0)
          default:
            return a.name.localeCompare(b.name)
        }
      })
  }, [services, searchTerm, sortBy])

  return (
    <div className="space-y-6">
      {/* Platform Header */}
      <div className="space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
            {platform.icon_url && (
              <Image 
                src={`/${platform.icon_url}.webp`} 
                alt={platform.name} 
                width={20} 
                height={20}
                className="object-contain sm:w-6 sm:h-6"
              />
            )}
          </div>
          <div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{platform.name}</h2>
            <p className="text-sm sm:text-base text-gray-600">{filteredServices.length} services disponibles</p>
          </div>
        </div>

        {/* Search and Sort - Responsive */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher un service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-48 lg:w-64 text-sm"
            />
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full sm:w-auto"
          >
            <option value="name">Trier par nom</option>
            <option value="price">Trier par prix</option>
            <option value="popularity">Trier par popularité</option>
          </select>
        </div>
      </div>

      {/* Services Table - Desktop */}
      <Card className="hidden lg:block">
        <CardContent className="p-0">
          <ServiceTableHeader />
          <div className="divide-y">
            {filteredServices.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun service trouvé</p>
              </div>
            ) : (
              filteredServices.map((service, index) => (
                <ServiceRow
                  key={service.id || index}
                  service={service}
                  index={index}
                  onAddToCart={onAddToCart}
                  onViewDetails={onViewDetails}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Services Cards - Mobile */}
      <div className="lg:hidden space-y-3">
        {filteredServices.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucun service trouvé</p>
          </div>
        ) : (
          filteredServices.map((service, index) => (
            <ServiceRow
              key={service.id || index}
              service={service}
              index={index}
              onAddToCart={onAddToCart}
              onViewDetails={onViewDetails}
            />
          ))
        )}
      </div>
    </div>
  )
}

// Main Services Page
export default function ServicesPage() {
  const { user } = useAuth()
  const { addItem } = useCart()

  
  const [platforms, setPlatforms] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPlatform, setSelectedPlatform] = useState('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchPlatforms = useCallback(async () => {
    const response = await fetch('/api/services', {
      headers: {
        'Cache-Control': 'max-age=600' // Cache 10 minutes
      }
    })
    const data = await response.json()
    return data.platforms || []
  }, [])

  const fetchServicesForPlatform = useCallback(async (platformId) => {
    const response = await fetch(`/api/services/${platformId}`, {
      headers: {
        'Cache-Control': 'max-age=300' // Cache 5 minutes
      }
    })
    const data = await response.json()
    return data.services || []
  }, [])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Fetch platforms avec cache
      const platformsData = await fetchPlatforms()
      setPlatforms(platformsData)
      
      // Fetch services en parallèle avec optimisation
      const servicePromises = platformsData.map(async (platform) => {
        try {
          const services = await fetchServicesForPlatform(platform.id)
          return services.map(service => ({
            ...service,
            platform_id: platform.id,
            platform_name: platform.name
          }))
        } catch (error) {
          console.error(`Error fetching services for ${platform.name}:`, error)
          return []
        }
      })
      
      const allServicesArrays = await Promise.all(servicePromises)
      const allServices = allServicesArrays.flat()
      setServices(allServices)
      
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [fetchPlatforms, fetchServicesForPlatform])

  const handleAddToCart = (item) => {
    if (!user) {
      toast.error('Veuillez vous connecter pour ajouter au panier')
      return
    }
    addItem(item)
  }

  const handleViewDetails = (service) => {
    // TODO: Open service details modal
    console.log('View details for:', service)
  }

  const groupedServices = useMemo(() => {
    const grouped = {}
    services.forEach(service => {
      const platformId = service.platform_id
      if (!grouped[platformId]) {
        grouped[platformId] = []
      }
      grouped[platformId].push(service)
    })
    return grouped
  }, [services])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    )
  }


  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
            Services SMM Premium
          </h1>
          <p className="text-sm sm:text-base lg:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            Découvrez nos services de qualité pour booster votre présence sur les réseaux sociaux.
            Prix compétitifs, livraison rapide, support 24/7.
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8 lg:mb-12">
          <Card>
            <CardContent className="p-3 sm:p-4 lg:p-6 text-center">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600 mb-1 sm:mb-2">
                {services.length}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Services disponibles</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 lg:p-6 text-center">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600 mb-1 sm:mb-2">24h</div>
              <div className="text-xs sm:text-sm text-gray-600">Livraison moyenne</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 lg:p-6 text-center">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600 mb-1 sm:mb-2">99%</div>
              <div className="text-xs sm:text-sm text-gray-600">Taux de réussite</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 lg:p-6 text-center">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-600 mb-1 sm:mb-2">24/7</div>
              <div className="text-xs sm:text-sm text-gray-600">Support client</div>
            </CardContent>
          </Card>
        </div>

        {/* Platform Tabs */}
        <Tabs value={selectedPlatform} onValueChange={setSelectedPlatform} className="space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Version Desktop des Tabs */}
          <TabsList className="hidden sm:grid w-full grid-cols-5 h-auto">
            <TabsTrigger value="all" className="text-xs lg:text-sm py-2 px-2 lg:px-4">
              <span className="hidden lg:inline">Tous les services</span>
              <span className="lg:hidden">Tous</span>
            </TabsTrigger>
            {platforms.map(platform => (
              <TabsTrigger key={platform.id} value={platform.id} className="text-xs lg:text-sm py-2 px-2 lg:px-4">
                <div className="flex items-center space-x-1 lg:space-x-2">
                  <Image 
                    src={`/${platform.icon_url}.webp`} 
                    alt={platform.name} 
                    width={14} 
                    height={14}
                    className="object-contain lg:w-4 lg:h-4"
                  />
                  <span className="hidden md:inline">{platform.name}</span>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
          
          {/* Version Mobile des Tabs - Scroll horizontal */}
          <div className="sm:hidden">
            <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
              <Button
                variant={selectedPlatform === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPlatform('all')}
                className="whitespace-nowrap"
              >
                Tous
              </Button>
              {platforms.map(platform => (
                <Button
                  key={platform.id}
                  variant={selectedPlatform === platform.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPlatform(platform.id)}
                  className="whitespace-nowrap flex items-center space-x-1"
                >
                  <Image 
                    src={`/${platform.icon_url}.webp`} 
                    alt={platform.name} 
                    width={14} 
                    height={14}
                    className="object-contain"
                  />
                  <span>{platform.name}</span>
                </Button>
              ))}
            </div>
          </div>

          <TabsContent value="all" className="space-y-8">
            {platforms.map(platform => {
              const platformServices = groupedServices[platform.id] || []
              if (platformServices.length === 0) return null
              
              return (
                <PlatformServices
                  key={platform.id}
                  platform={platform}
                  services={platformServices}
                  onAddToCart={handleAddToCart}
                  onViewDetails={handleViewDetails}
                />
              )
            })}
          </TabsContent>

          {platforms.map(platform => (
            <TabsContent key={platform.id} value={platform.id}>
              <PlatformServices
                platform={platform}
                services={groupedServices[platform.id] || []}
                onAddToCart={handleAddToCart}
                onViewDetails={handleViewDetails}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}