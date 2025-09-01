"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Upload, 
  Smartphone, 
  CreditCard, 
  Shield, 
  Clock, 
  CheckCircle,
  AlertCircle,
  FileImage,
  Trash2,
  Phone,
  Copy
} from "lucide-react"
import { toast } from "sonner"
import { createOrder } from "@/lib/actions/orders"
import { uploadPaymentProof } from "@/lib/actions/orders"

export function ManualPayment({ cartItems, currency, onSuccess, onError }) {
  const [isLoading, setIsLoading] = useState(false)
  const [customerData, setCustomerData] = useState({
    name: "",
    email: "",
    phone: "",
    // address: "",
    // city: ""
  })
  const [paymentProof, setPaymentProof] = useState(null)
  const [orderId, setOrderId] = useState(null)
  const [step, setStep] = useState(1) // 1: payment instructions, 2: customer info, 3: order creation

  const handleInputChange = (field, value) => {
    setCustomerData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image (JPG, PNG, etc.)')
      return
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image doit faire moins de 5MB')
      return
    }

    // Convertir en base64
    const reader = new FileReader()
    reader.onload = (e) => {
      setPaymentProof({
        file,
        data: e.target.result.split(',')[1], // Enlever le préfixe data:image/...
        type: file.type
      })
    }
    reader.readAsDataURL(file)
  }

  const removeFile = () => {
    setPaymentProof(null)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Numéro copié dans le presse-papiers')
  }

  const validateCustomerData = () => {
    if (!customerData.name.trim()) {
      toast.error('Le nom est requis')
      return false
    }
    if (!customerData.email.trim()) {
      toast.error('L\'email est requis')
      return false
    }
    if (!customerData.phone.trim()) {
      toast.error('Le téléphone est requis')
      return false
    }
    if (!paymentProof) {
      toast.error('La capture d\'écran du paiement est obligatoire')
      return false
    }
    return true
  }

  const handleCreateOrder = async () => {
    if (!validateCustomerData()) return

    setIsLoading(true)
    try {
      // Préparer les données selon le schéma de validation
      const totalAmount = currency === "CDF" 
        ? cartItems.reduce((sum, item) => sum + item.total_cdf, 0)
        : cartItems.reduce((sum, item) => sum + item.total_usd, 0)

      const orderData = {
        items: cartItems.map(item => ({
          service_id: item.service_id,
          service_name: item.service_name,
          platform: item.platform_id || item.platform,
          target_link: item.target_link,
          quantity: item.quantity,
          price_usd: item.price_usd,
          price_cdf: item.price_cdf,
          total_usd: item.total_usd,
          total_cdf: item.total_cdf
        })),
        total_usd: cartItems.reduce((sum, item) => sum + item.total_usd, 0),
        total_cdf: cartItems.reduce((sum, item) => sum + item.total_cdf, 0),
        currency,
        customer_name: customerData.name,
        customer_email: customerData.email,
        customer_phone: customerData.phone,
        payment_method: 'manual',
        notes: `Adresse: ${customerData.address || 'Non fournie'}, Ville: ${customerData.city || 'Non fournie'}`
      }

      const result = await createOrder(orderData)
      setOrderId(result.order_id)
      setStep(3)
      toast.success('Commande créée ! Maintenant, téléchargez votre preuve de paiement.')
    } catch (error) {
      console.error('Erreur création commande:', error)
      toast.error(error.message || 'Erreur lors de la création de la commande')
      onError?.(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitPaymentProof = async () => {
    if (!paymentProof) {
      toast.error('Veuillez télécharger une capture d\'écran de votre paiement')
      return
    }

    setIsLoading(true)
    try {
      await uploadPaymentProof(orderId, paymentProof)
      toast.success('Preuve de paiement téléchargée ! Votre commande sera vérifiée sous 30 minutes.')
      onSuccess?.()
    } catch (error) {
      console.error('Erreur upload preuve:', error)
      toast.error(error.message || 'Erreur lors du téléchargement de la preuve')
      onError?.(error)
    } finally {
      setIsLoading(false)
    }
  }

  const totalAmount = currency === "CDF" 
    ? cartItems.reduce((sum, item) => sum + item.total_cdf, 0)
    : cartItems.reduce((sum, item) => sum + item.total_usd, 0)

  return (
    <div className="space-y-6">
      {/* Étape 1: Instructions de paiement */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Smartphone className="w-5 h-5" />
              <span>Instructions de paiement</span>
            </CardTitle>
            <CardDescription>
              Effectuez d'abord votre paiement Mobile Money, puis téléchargez la capture d'écran
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Montant à payer */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-center">
                <h4 className="font-medium text-blue-900 mb-2">Montant à payer</h4>
                <div className="text-2xl font-bold text-blue-600">
                  {currency === "CDF" ? `${totalAmount.toLocaleString()} CDF` : `$${totalAmount.toFixed(2)}`}
                </div>
              </div>
            </div>

            {/* Numéros de téléphone */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Numéros de paiement :</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col p-1 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="font-medium text-orange-900">Orange Money</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-orange-700">085125555</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard('085125555')}
                      className="text-orange-600 hover:text-orange-700"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col p-1 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="font-medium text-blue-900">Airtel Money</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-blue-700">0975255555</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard('0975255555')}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col p-1 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-green-900">M-Pesa</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-green-700">083595255</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard('083595255')}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col p-1 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="font-medium text-purple-900">Africell</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-purple-700">090054525</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard('090054525')}
                      className="text-purple-600 hover:text-purple-700"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900">Instructions importantes :</h4>
                  <ol className="text-sm text-yellow-700 mt-2 space-y-1 list-decimal list-inside">
                    <li>Effectuez votre paiement Mobile Money au montant exact indiqué</li>
                    <li>Prenez une capture d'écran du reçu de transaction</li>
                    <li>Assurez-vous que le montant et le numéro de téléphone sont visibles</li>
                    <li>Puis cliquez sur "Continuer" pour remplir vos informations</li>
                  </ol>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => setStep(2)}
              className="w-full"
              size="lg"
            >
              J'ai effectué le paiement - Continuer
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Étape 2: Informations client */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5" />
              <span>Informations client</span>
            </CardTitle>
            <CardDescription>
              Remplissez vos informations et téléchargez la capture d'écran
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
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={customerData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="votre@email.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Téléphone *</Label>
                <Input
                  id="phone"
                  value={customerData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+243 123 456 789"
                  required
                />
              </div>
              {/* <div>
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  value={customerData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Kinshasa"
                />
              </div> */}
            </div>
            {/* <div>
              <Label htmlFor="address">Adresse</Label>
              <Textarea
                id="address"
                value={customerData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Votre adresse complète"
                rows={3}
              />
            </div> */}

            <Separator />

            {/* Upload capture d'écran */}
            <div>
              <Label className="text-base font-medium">Capture d'écran du paiement *</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors mt-2">
                {!paymentProof ? (
                  <div>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <Label htmlFor="payment-proof" className="cursor-pointer">
                      <div className="text-lg font-medium text-gray-900 mb-2">
                        Télécharger la capture d'écran
                      </div>
                      <div className="text-sm text-gray-500 mb-4">
                        JPG, PNG - Max 5MB - <strong>OBLIGATOIRE</strong>
                      </div>
                      <span className="text-sm  border border-gray-300 rounded-md px-2 py-1 cursor-pointer text-gray-500 mb-4">
                        Choisir un fichier
                      </span>
                    </Label>
                    <Input
                      id="payment-proof"
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-center space-x-3 mb-4">
                      <FileImage className="w-8 h-8 text-green-600" />
                      <div>
                        <div className="font-medium text-gray-900">{paymentProof.file.name}</div>
                        <div className="text-sm text-gray-500">
                          {(paymentProof.file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={removeFile}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="text-sm text-green-600 font-medium">
                      ✓ Capture d'écran sélectionnée
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Button 
              onClick={handleCreateOrder}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? "Création de la commande..." : "Créer la commande"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Étape 3: Confirmation et upload final */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Commande créée avec succès !</span>
            </CardTitle>
            <CardDescription>
              Votre commande a été créée et est en attente de vérification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900">Commande créée !</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Numéro de commande: <strong>{orderId}</strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Temps de vérification</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Votre commande sera vérifiée et traitée sous 30 minutes après réception de la preuve de paiement.
                  </p>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleSubmitPaymentProof}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? "Envoi en cours..." : "Finaliser la commande"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Informations de sécurité */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-gray-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-gray-900">Sécurité et confidentialité</h4>
            <p className="text-sm text-gray-600 mt-1">
              Vos informations et preuves de paiement sont sécurisées et ne seront utilisées que pour la vérification de votre commande.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
