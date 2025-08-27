// src/components/payments/CinetPayPayment.jsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  CreditCard, 
  Smartphone, 
  Shield, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Lock
} from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/hooks/useAuth"

export function CinetPayPayment({ cartItems, currency, onSuccess, onError }) {
  const router = useRouter()
  const { user } = useAuth()
  
  const [loading, setLoading] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState('')
  const [customerData, setCustomerData] = useState({
    name: '',
    email: user?.email || '',
    phone: ''
  })
  const [validationErrors, setValidationErrors] = useState({})
  const [paymentStep, setPaymentStep] = useState('method') // method, details, processing
  
  // Calculer les totaux
  const totalUSD = cartItems.reduce((sum, item) => sum + (item.total_usd || 0), 0)
  const totalCDF = cartItems.reduce((sum, item) => sum + (item.total_cdf || 0), 0)
  const displayAmount = currency === 'USD' ? totalUSD : totalCDF

  // Méthodes de paiement disponibles pour la RDC
  const paymentMethods = [
    {
      id: 'orange',
      name: 'Orange Money',
      icon: '🟠',
      description: 'Paiement via Orange Money RDC',
      fees: 'Frais: 1.5%',
      available: true
    },
    {
      id: 'airtel',
      name: 'Airtel Money',
      icon: '🔴',
      description: 'Paiement via Airtel Money RDC',
      fees: 'Frais: 1.5%',
      available: true
    },
    {
      id: 'mtn',
      name: 'MTN Mobile Money',
      icon: '🟡',
      description: 'Paiement via MTN Mobile Money',
      fees: 'Frais: 2%',
      available: false // Pas encore disponible en RDC via CinetPay
    }
  ]

  useEffect(() => {
    if (user && !customerData.email) {
      setCustomerData(prev => ({
        ...prev,
        email: user.email
      }))
    }
  }, [user])

  const validateCustomerData = () => {
    const errors = {}

    if (!customerData.name?.trim()) {
      errors.name = 'Le nom complet est requis'
    }

    if (!customerData.email?.trim()) {
      errors.email = 'L\'email est requis'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerData.email)) {
      errors.email = 'Format email invalide'
    }

    if (!customerData.phone?.trim()) {
      errors.phone = 'Le numéro de téléphone est requis'
    } else if (!/^(\+?243|0)[0-9]{9}$/.test(customerData.phone.replace(/\s|-/g, ''))) {
      errors.phone = 'Format téléphone invalide (ex: +243812345678 ou 0812345678)'
    }

    if (!selectedMethod) {
      errors.method = 'Veuillez sélectionner une méthode de paiement'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const formatPhoneNumber = (phone) => {
    const cleaned = phone.replace(/\s|-/g, '')
    if (cleaned.startsWith('0')) {
      return `+243${cleaned.substring(1)}`
    }
    if (cleaned.startsWith('243')) {
      return `+${cleaned}`
    }
    if (cleaned.startsWith('+')) {
      return cleaned
    }
    return `+243${cleaned}`
  }

  const handlePayment = async () => {
    if (!validateCustomerData()) {
      toast.error('Veuillez corriger les erreurs dans le formulaire')
      return
    }

    try {
      setLoading(true)
      setPaymentStep('processing')

      console.log('Initiation du paiement CinetPay...')
      console.log('Items panier:', cartItems)
      console.log('Devise:', currency)
      console.log('Méthode sélectionnée:', selectedMethod)
      console.log('Données client:', customerData)

      const paymentData = {
        cartItems: cartItems,
        currency: currency,
        paymentMethod: selectedMethod,
        customerData: {
          ...customerData,
          phone: formatPhoneNumber(customerData.phone)
        }
      }

      const response = await fetch('/api/payments/cinetpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      })

      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la création du paiement')
      }

      console.log('Paiement CinetPay créé:', data)

      // Redirection vers la page de paiement CinetPay
      if (data.paymentUrl) {
        toast.success('Redirection vers la page de paiement...')
        
        // Sauvegarder les informations de transaction dans le localStorage pour le retour
        localStorage.setItem('cinetpay_transaction', JSON.stringify({
          transactionId: data.transactionId,
          amount: data.amount,
          currency: data.currency,
          paymentMethod: selectedMethod,
          items: cartItems.length,
          timestamp: new Date().toISOString()
        }))

        // Redirection vers CinetPay
        window.location.href = data.paymentUrl
      } else {
        throw new Error('URL de paiement non reçue')
      }

    } catch (error) {
      console.error('Erreur paiement CinetPay:', error)
      toast.error(error.message || 'Erreur lors de l\'initiation du paiement')
      setPaymentStep('method')
      
      if (onError) {
        onError(error)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleMethodSelect = (methodId) => {
    const method = paymentMethods.find(m => m.id === methodId)
    if (method?.available) {
      setSelectedMethod(methodId)
      setValidationErrors(prev => ({ ...prev, method: null }))
    }
  }

  const handleInputChange = (field, value) => {
    setCustomerData(prev => ({ ...prev, [field]: value }))
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  if (paymentStep === 'processing') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <Loader2 className="w-16 h-16 animate-spin mx-auto text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold">Préparation du paiement...</h3>
              <p className="text-sm text-muted-foreground">
                Redirection vers {paymentMethods.find(m => m.id === selectedMethod)?.name}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Résumé de la commande */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Résumé du paiement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span>Services sélectionnés</span>
            <Badge variant="outline">{cartItems?.length || 0} service(s)</Badge>
          </div>
          <Separator />
          
          {/* Affichage des items */}
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {cartItems.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="truncate">{item.service_name}</span>
                <span>{item.quantity.toLocaleString()}</span>
              </div>
            ))}
          </div>
          
          <Separator />
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total à payer</span>
            <span>
              {currency === 'USD' 
                ? `$${totalUSD.toFixed(2)}` 
                : `${totalCDF.toLocaleString()} CDF`
              }
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Sélection de la méthode de paiement */}
      <Card>
        <CardHeader>
          <CardTitle>Méthode de paiement</CardTitle>
          <CardDescription>
            Choisissez votre méthode de paiement mobile money
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={selectedMethod} 
            onValueChange={handleMethodSelect}
            className="space-y-3"
          >
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={`flex items-center space-x-2 p-4 rounded-lg border transition-colors ${
                  method.available 
                    ? 'cursor-pointer hover:bg-gray-50' 
                    : 'opacity-50 cursor-not-allowed'
                } ${
                  selectedMethod === method.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => method.available && handleMethodSelect(method.id)}
              >
                <RadioGroupItem 
                  value={method.id} 
                  id={method.id}
                  disabled={!method.available}
                  className={selectedMethod === method.id ? 'border-blue-500' : ''}
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{method.icon}</span>
                    <div>
                      <Label htmlFor={method.id} className="font-medium cursor-pointer">
                        {method.name}
                        {!method.available && (
                          <Badge variant="secondary" className="ml-2">Bientôt</Badge>
                        )}
                      </Label>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                      {method.available && (
                        <p className="text-xs text-muted-foreground">{method.fees}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </RadioGroup>
          
          {validationErrors.method && (
            <Alert className="mt-3">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{validationErrors.method}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Informations client */}
      <Card>
        <CardHeader>
          <CardTitle>Informations de facturation</CardTitle>
          <CardDescription>
            Vérifiez et complétez vos informations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nom complet *</Label>
              <Input
                id="name"
                value={customerData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Votre nom complet"
                className={validationErrors.name ? 'border-red-500' : ''}
              />
              {validationErrors.name && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={customerData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="votre@email.com"
                className={validationErrors.email ? 'border-red-500' : ''}
              />
              {validationErrors.email && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.email}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="phone">Numéro de téléphone *</Label>
            <Input
              id="phone"
              value={customerData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+243812345678 ou 0812345678"
              className={validationErrors.phone ? 'border-red-500' : ''}
            />
            {validationErrors.phone && (
              <p className="text-sm text-red-500 mt-1">{validationErrors.phone}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Ce numéro sera utilisé pour recevoir les instructions de paiement
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sécurité et informations */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-green-600" />
              <div>
                <h4 className="font-medium">Paiement sécurisé</h4>
                <p className="text-sm text-muted-foreground">
                  Vos données sont protégées par le chiffrement SSL
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className="font-medium">Traitement rapide</h4>
                <p className="text-sm text-muted-foreground">
                  Confirmation instantanée du paiement
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Smartphone className="w-5 h-5 text-purple-600" />
              <div>
                <h4 className="font-medium">Mobile Money</h4>
                <p className="text-sm text-muted-foreground">
                  Paiement direct depuis votre portefeuille mobile
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions de paiement */}
      {selectedMethod && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Comment ça marche :</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
              <li>Cliquez sur "Payer maintenant" pour être redirigé vers la page de paiement</li>
              <li>Suivez les instructions pour finaliser le paiement avec {paymentMethods.find(m => m.id === selectedMethod)?.name}</li>
              <li>Vous serez automatiquement redirigé après le paiement</li>
              <li>Votre commande sera traitée immédiatement après confirmation</li>
            </ol>
          </AlertDescription>
        </Alert>
      )}

      {/* Bouton de paiement */}
      <div className="space-y-4">
        <Button
          onClick={handlePayment}
          disabled={loading || !selectedMethod}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Préparation...
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 mr-2" />
              Payer maintenant
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          En cliquant sur "Payer maintenant", vous acceptez nos conditions d'utilisation
          et êtes redirigé vers notre partenaire de paiement sécurisé CinetPay.
        </p>
      </div>
    </div>
  )
}