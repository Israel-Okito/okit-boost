"use client"

import { useState, useEffect } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Star, 
  Users, 
  Heart, 
  Eye, 
  TrendingUp, 
  Clock, 
  Shield, 
  Zap,
  AlertTriangle,
  CheckCircle,
  Info,
  ShoppingCart,
  ExternalLink
} from "lucide-react"
import { toast } from "sonner"

const SERVICE_ICONS = {
  'followers': Users,
  'likes': Heart,
  'views': Eye,
  'comments': TrendingUp,
  'shares': Star,
  'saves': Star
}

const PLATFORM_COLORS = {
  'tiktok': 'bg-black text-white',
  'instagram': 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
  'facebook': 'bg-blue-600 text-white',
  'youtube': 'bg-red-600 text-white',
  'twitter': 'bg-blue-400 text-white',
  'linkedin': 'bg-blue-700 text-white',
  'spotify': 'bg-green-600 text-white',
  'snapchat': 'bg-blue-600 text-white'
}

export function ServiceDetailsDialog({ service, isOpen, onOpenChange, onAddToCart }) {
  const [quantity, setQuantity] = useState(service?.min_quantity || 100)
  const [quantityInput, setQuantityInput] = useState(String(service?.min_quantity || 100))
  const [quantityError, setQuantityError] = useState('')
  const [targetLink, setTargetLink] = useState('')
  const [urlError, setUrlError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)

  // Reset form when service changes
  useEffect(() => {
    if (service) {
      const minQty = service.min_quantity || 100
      setQuantity(minQty)
      setQuantityInput(String(minQty))
      setQuantityError('')
      setTargetLink('')
      setUrlError('')
    }
  }, [service])

  if (!service) return null

  const handleQuantityInputChange = (value) => {
    setQuantityInput(value)
    setQuantityError('')
    
    // Validation en temps réel pour afficher les erreurs
    if (value.trim() === '') {
      setQuantityError('La quantité est requise')
      return
    }
    
    const numValue = parseInt(value)
    if (isNaN(numValue)) {
      setQuantityError('Veuillez entrer un nombre valide')
      return
    }
    
    if (numValue < (service.min_quantity || 1)) {
      setQuantityError(`Minimum: ${service.min_quantity || 1}`)
      return
    }
    
    if (numValue > (service.max_quantity || 1000000)) {
      setQuantityError(`Maximum: ${service.max_quantity?.toLocaleString() || 1000000}`)
      return
    }
    
    // Mettre à jour la quantité en temps réel pour le calcul du total
    setIsCalculating(true)
    setQuantity(numValue)
    
    // Animation de calcul
    setTimeout(() => {
      setIsCalculating(false)
    }, 200)
  }

  const handleQuantityBlur = () => {
    const numValue = parseInt(quantityInput)
    
    if (isNaN(numValue) || numValue < (service.min_quantity || 1)) {
      // Remettre la valeur minimale
      const minQty = service.min_quantity || 100
      setQuantity(minQty)
      setQuantityInput(String(minQty))
      setQuantityError('')
      toast.error(`Quantité minimale: ${minQty}`)
      return
    }
    
    if (numValue > (service.max_quantity || 1000000)) {
      // Remettre la valeur maximale
      const maxQty = service.max_quantity || 1000000
      setQuantity(maxQty)
      setQuantityInput(String(maxQty))
      setQuantityError('')
      toast.error(`Quantité maximale: ${maxQty.toLocaleString()}`)
      return
    }
    
    // Valeur valide
    setQuantity(numValue)
    setQuantityError('')
  }

  const validateURL = (url) => {
    if (!url.trim()) {
      return { valid: false, message: 'Veuillez entrer un lien cible' }
    }

    try {
      const urlObj = new URL(url)
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return { valid: false, message: 'Le lien doit commencer par https://' }
      }
      return { valid: true }
    } catch (error) {
      return { valid: false, message: 'Format d\'URL invalide' }
    }
  }

  const handleUrlChange = (url) => {
    setTargetLink(url)
    if (url.trim()) {
      const validation = validateURL(url)
      setUrlError(validation.valid ? '' : validation.message)
    } else {
      setUrlError('')
    }
  }

  const handleAddToCart = async () => {
    const validation = validateURL(targetLink)
    if (!validation.valid) {
      setUrlError(validation.message)
      return
    }

    setIsLoading(true)
    try {
      await onAddToCart(service, quantity, targetLink)
      
      // Reset form after successful add
      setTargetLink('')
      setQuantity(service.min_quantity || 500)
      setUrlError('')
      
      // Close dialog
      onOpenChange(false)
      
    } catch (error) {
      console.error('Erreur ajout panier:', error)
      toast.error('Erreur lors de l\'ajout au panier')
    } finally {
      setIsLoading(false)
    }
  }

  const IconComponent = SERVICE_ICONS[service.service_type?.toLowerCase()] || Star
  const platformColorClass = PLATFORM_COLORS[service.platform_name?.toLowerCase()] || 'bg-gray-600 text-white'
  
  // Calcul correct du prix par unité et du total
  const pricePerUnit = service.price_cdf || 0
  const totalPrice = Math.ceil(quantity * pricePerUnit)
  const totalPriceUSD = (totalPrice / 2800).toFixed(2)

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl  max-h-[80vh] md:max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${platformColorClass}`}>
              <IconComponent className="w-4 h-4" />
            </div>
            <div className="flex-1 space-y-2">
              <DialogTitle className="text-xl sm:text-2xl leading-tight">
                {service.name}
              </DialogTitle>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className={platformColorClass}>
                  {service.platform_name}
                </Badge>
             
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Description complète */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold">Description détaillée</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {service.description || 'Aucune description disponible pour ce service.'}
              </p>
            </CardContent>
          </Card>

          {/* Informations de tarification */}
          <div className="grid grid-cols-2  lg:grid-cols-4 gap-4">
                         <Card>
               <CardContent className="p-4 text-center">
                 <div className="text-2xl font-bold text-green-600">
                   {service.price_cdf ? service.price_cdf.toFixed(0) : '0'} CDF
                 </div>
                 <div>
                   ${(service.price_usd || 0).toFixed(4)}
                 </div>
                 <p className="text-sm text-gray-500">par unité</p>
               </CardContent>
             </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-xl sm:text-2xl font-bold text-orange-600">
                  ~{service.delivery_time || 'N/A'}
                </div>
                <p className="text-sm text-gray-500">délai</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {service.min_quantity?.toLocaleString() || 'N/A'}
                </div>
                <p className="text-sm text-gray-500">minimum</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {service.max_quantity?.toLocaleString() || 'N/A'}
                </div>
                <p className="text-sm text-gray-500">maximum</p>
              </CardContent>
            </Card>
            
       
          </div>

          {/* Garanties et qualité */}
          <div className="grid grid-cols-1 gap-4">
            {/* <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-green-500" />
                  <h3 className="font-semibold">Garanties</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Livraison garantie</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Support 24/7</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Comptes réels</span>
                  </div>
                </div>
              </CardContent>
            </Card> */}

            <Card>
              <CardContent className="p-2">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <h3 className="font-semibold">Processus</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Démarrage immédiat</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">Livraison progressive</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-500" />
                    <span className="text-sm">100% sécurisé</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Formulaire de commande */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCart className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-lg">Commander ce service</h3>
              </div>
              
              <div className="space-y-4">
                {/* Lien cible */}
                <div className="space-y-2">
                  <Label htmlFor="target-link" className="text-sm font-medium">
                    Lien cible pour la commande
                  </Label>
                  <div className="relative">
                    <Input
                      id="target-link"
                      // type="url"
                      placeholder="https://www.example.com/votre-lien"
                      value={targetLink}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      className={urlError ? 'border-red-500' : ''}
                    />
                    {/* <ExternalLink className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" /> */}
                  </div>
                  {urlError && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      {urlError}
                    </div>
                  )}
                </div>

                {/* Quantité */}
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-sm font-medium">
                    Quantité souhaitée
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="quantity"
                      type="text"
                      value={quantityInput}
                      onChange={(e) => handleQuantityInputChange(e.target.value)}
                      onBlur={handleQuantityBlur}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.target.blur()
                        }
                      }}
                      className={`flex-1 ${quantityError ? 'border-red-500' : ''}`}
                      placeholder="Ex: 1000"
                    />
                  </div>
                  {quantityError && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      {quantityError}
                    </div>
                  )}
                  <div className="text-sm text-gray-500">
                    Min: {service.min_quantity?.toLocaleString() || '1'} • Max: {service.max_quantity?.toLocaleString() || '1,000,000'}
                  </div>
                </div>

                                 {/* Récapitulatif prix */}
                 <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                   <CardContent className="p-4">
                     <div className="flex justify-between items-center">
                       <div>
                         <div className="text-sm text-gray-700 font-medium">Total à payer</div>
                         <div className="text-xs text-gray-500">
                           {quantity.toLocaleString()} × {pricePerUnit.toFixed(0)} CDF
                         </div>
                       </div>
                       <div className="text-right">
                         <div className={`text-2xl font-bold text-green-600 transition-all duration-300 ease-out ${
                           isCalculating ? 'transform scale-110 animate-pulse' : 'transform scale-105'
                         }`}>
                           {totalPrice.toLocaleString()} CDF
                         </div>
                         <div className="text-sm text-gray-700 font-semibold">
                           ~{totalPriceUSD} USD
                         </div>
                       </div>
                     </div>
                   </CardContent>
                 </Card>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="flex-1 sm:flex-initial"
          >
            Annuler
          </Button>
          <Button 
            onClick={handleAddToCart}
            disabled={isLoading || !targetLink.trim() || urlError || quantityError}
            className="flex-1 sm:flex-initial"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Ajout...
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Ajouter au panier
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
