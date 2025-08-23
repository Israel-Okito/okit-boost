// Modifications à apporter à src/app/caisse/page.jsx
// Ajouter l'intégration CinetPay

"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  ShoppingCart, 
  CreditCard, 
  Trash2, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  Smartphone,
  ExternalLink,
  Shield,
  Zap
} from "lucide-react"
import { useCart } from "@/hooks/useCart"
import { useAuth } from "@/lib/hooks/useAuth"
import { toast } from "sonner"
import { orderSchema } from "@/lib/validations"

export default function CheckoutPage() {
  const router = useRouter()
  const { user, profile } = useAuth()
  const { items, removeItem, clearCart, getTotalUSD, getTotalCDF } = useCart()

  const [formData, setFormData] = useState({
    name: profile?.full_name || "",
    email: profile?.email || user?.email || "",
    phone: profile?.phone || "",
    paymentMethod: "",
    paymentType: "manual", // "manual" ou "cinetpay"
    notes: "",
  })

  const [proofFile, setProofFile] = useState(null)
  const [proofPreview, setProofPreview] = useState(null)
  const [currency, setCurrency] = useState("CDF")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [errors, setErrors] = useState({})

  // Méthodes de paiement supportées par CinetPay
  const cinetpayMethods = [
    { 
      value: "orange", 
      label: "Orange Money", 
      icon: "🟠",
      countries: ["CD", "CI", "CM", "SN"]
    },
    { 
      value: "airtel", 
      label: "Airtel Money", 
      icon: "🔴",
      countries: ["CD"]
    },
    { 
      value: "mtn", 
      label: "MTN Mobile Money", 
      icon: "🟡",
      countries: ["CI", "CM", "SN"]
    },
    { 
      value: "moov", 
      label: "Moov Money", 
      icon: "🔵",
      countries: ["CI", "SN"]
    }
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }))
    }
  }

  const handlePaymentTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      paymentType: type,
      paymentMethod: "" // Reset payment method when changing type
    }))
    
    // Reset file upload if switching to CinetPay
    if (type === "cinetpay") {
      setProofFile(null)
      setProofPreview(null)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast.error('Fichier trop volumineux (max 5MB)')
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format non supporté (JPEG, PNG uniquement)')
      return
    }

    setProofFile(file)

    const reader = new FileReader()
    reader.onload = (e) => {
      setProofPreview(e.target?.result)
    }
    reader.readAsDataURL(file)
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nom requis'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email requis'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email invalide'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Téléphone requis'
    } else if (formData.phone.length < 10) {
      newErrors.phone = 'Numéro invalide'
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Méthode de paiement requise'
    }

    // Validation spécifique pour paiement manuel
    if (formData.paymentType === 'manual' && !proofFile) {
      newErrors.proof = 'Preuve de paiement requise'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const processWithCinetPay = async (orderData) => {
    try {
      setIsProcessingPayment(true)
      
      // Créer d'abord la commande
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...orderData,
          status: 'pending_payment' // Statut spécial pour paiement CinetPay
        })
      })

      const orderResult = await orderResponse.json()

      if (!orderResponse.ok) {
        throw new Error(orderResult.error || 'Erreur lors de la création de la commande')
      }

      // Initier le paiement CinetPay
      const paymentResponse = await fetch('/api/payments/cinetpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: orderResult.order_id,
          paymentMethod: formData.paymentMethod
        })
      })

      const paymentResult = await paymentResponse.json()

      console.log('paymentResult', paymentResult)

      if (!paymentResponse.ok) {
        throw new Error(paymentResult.error || 'Erreur lors de l\'initialisation du paiement')
      }

      // Rediriger vers CinetPay
      toast.success('Redirection vers CinetPay...')
      clearCart()
      window.location.href = paymentResult.paymentUrl

    } catch (error) {
      console.error('Error processing CinetPay payment:', error)
      throw error
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const processManualPayment = async (orderData) => {
    try {
      // Créer la commande
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la création de la commande')
      }

      // Upload de la preuve de paiement
      if (proofFile) {
        setUploadProgress(50)
        await uploadPaymentProof(result.order_id)
        setUploadProgress(100)
      }

      toast.success(`Commande ${result.order_number} créée avec succès!`)
      clearCart()
      router.push('/mon-compte')

    } catch (error) {
      console.error('Error creating manual order:', error)
      throw error
    }
  }

  const uploadPaymentProof = async (orderId) => {
    if (!proofFile) return null

    const formData = new FormData()
    formData.append('file', proofFile)
    formData.append('orderId', orderId)

    const response = await fetch('/api/upload/payment-proof', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erreur lors du téléchargement')
    }

    const data = await response.json()
    return data.url
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs')
      return
    }

    if (!user) {
      toast.error('Vous devez être connecté pour commander')
      router.push('/connexion')
      return
    }

    setIsSubmitting(true)

    try {
      // Préparer les données de commande
      const orderData = {
        items: items.map(item => ({
          service_id: item.service_id,
          service_name: item.service_name,
          platform: item.platform,
          target_link: item.target_link,
          quantity: item.quantity,
          price_usd: item.price_usd,
          price_cdf: item.price_cdf,
          total_usd: item.total_usd,
          total_cdf: item.total_cdf
        })),
        total_usd: getTotalUSD(),
        total_cdf: getTotalCDF(),
        currency,
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        payment_method: formData.paymentMethod,
        notes: formData.notes
      }

      // Valider avec Zod
      const validatedData = orderSchema.parse(orderData)

      // Traiter selon le type de paiement
      if (formData.paymentType === 'cinetpay') {
        await processWithCinetPay(validatedData)
      } else {
        await processManualPayment(validatedData)
      }

    } catch (error) {
      console.error('Error processing order:', error)
      toast.error(error.message || 'Erreur lors de la soumission')
    } finally {
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Votre panier est vide</h1>
        <p className="text-gray-600 mb-8">Ajoutez des services à votre panier pour continuer</p>
        <Button onClick={() => router.push("/")}>Retour à l'accueil</Button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Finaliser la commande</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Récapitulatif commande */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Récapitulatif de la commande
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
                {items.map((item) => (
                  <div key={item.service_id} className="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.service_name}</h3>
                      <p className="text-sm text-gray-600 capitalize">
                        {item.platform}
                      </p>
                      <p className="text-sm text-gray-600">Quantité: {item.quantity.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 truncate text-wrap">{item.target_link}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {currency === "CDF"
                          ? `${item.total_cdf.toLocaleString()} CDF`
                          : `${item.total_usd.toFixed(2)}`}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.service_id)}
                        className="text-white hover:text-white/80 bg-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  Total: {currency === "CDF" ? `${getTotalCDF().toLocaleString()} CDF` : `${getTotalUSD().toFixed(2)}`}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Formulaire de paiement */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Informations de paiement
              </CardTitle>
              <CardDescription>Complétez vos informations pour finaliser la commande</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informations personnelles */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nom complet *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Votre nom complet"
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="votre@email.com"
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">Téléphone *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      placeholder="+243 XXX XXX XXX"
                      className={errors.phone ? 'border-red-500' : ''}
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
                    )}
                  </div>
                </div>

                {/* Type de paiement */}
                <div className="space-y-4">
                  <Label>Mode de paiement *</Label>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {/* CinetPay Option */}
                    <div 
                      onClick={() => handlePaymentTypeChange('cinetpay')}
                      className={`cursor-pointer border-2 rounded-lg p-4 transition-all ${
                        formData.paymentType === 'cinetpay' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="paymentType"
                          value="cinetpay"
                          checked={formData.paymentType === 'cinetpay'}
                          onChange={() => handlePaymentTypeChange('cinetpay')}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <Smartphone className="w-5 h-5 text-blue-600" />
                            <span className="font-medium">Paiement Mobile Money</span>
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              <Zap className="w-3 h-3 mr-1" />
                              Instantané
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Payez directement avec Orange Money, Airtel Money, MTN, etc.
                          </p>
                          <div className="flex items-center mt-2 space-x-2">
                            <Shield className="w-4 h-4 text-green-600" />
                            <span className="text-xs text-green-600">Sécurisé par CinetPay</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Manual Payment Option */}
                    <div 
                      onClick={() => handlePaymentTypeChange('manual')}
                      className={`cursor-pointer border-2 rounded-lg p-4 transition-all ${
                        formData.paymentType === 'manual' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="paymentType"
                          value="manual"
                          checked={formData.paymentType === 'manual'}
                          onChange={() => handlePaymentTypeChange('manual')}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <Upload className="w-5 h-5 text-orange-600" />
                            <span className="font-medium">Paiement Manuel</span>
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                              Avec preuve
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Effectuez le paiement puis téléchargez la preuve
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Méthode de paiement spécifique */}
                {formData.paymentType && (
                  <div>
                    <Label htmlFor="paymentMethod">
                      {formData.paymentType === 'cinetpay' ? 'Opérateur Mobile Money *' : 'Moyen de paiement *'}
                    </Label>
                    <Select
                      value={formData.paymentMethod}
                      onValueChange={(value) => {
                        setFormData({ ...formData, paymentMethod: value })
                        if (errors.paymentMethod) {
                          setErrors(prev => ({ ...prev, paymentMethod: null }))
                        }
                      }}
                    >
                      <SelectTrigger className={errors.paymentMethod ? 'border-red-500' : ''}>
                        <SelectValue placeholder={
                          formData.paymentType === 'cinetpay' 
                            ? "Choisissez votre opérateur"
                            : "Choisissez votre moyen de paiement"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.paymentType === 'cinetpay' ? (
                          cinetpayMethods.map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                              <div className="flex items-center space-x-2">
                                <span>{method.icon}</span>
                                <span>{method.label}</span>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <>
                            <SelectItem value="orange">Orange Money</SelectItem>
                            <SelectItem value="airtel">Airtel Money</SelectItem>
                            <SelectItem value="mpesa">M-Pesa</SelectItem>
                            <SelectItem value="afrimoney">AFRIMONEY</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    {errors.paymentMethod && (
                      <p className="text-sm text-red-500 mt-1">{errors.paymentMethod}</p>
                    )}
                  </div>
                )}

                {/* Instructions pour paiement manuel */}
                {formData.paymentType === 'manual' && formData.paymentMethod && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Instructions de paiement
                    </h4>
                    <div className="text-sm text-blue-700 space-y-2">
                      {formData.paymentMethod === "orange" && (
                        <div>
                          <p><strong>1.</strong> Composez *144# sur votre téléphone</p>
                          <p><strong>2.</strong> Choisissez "Transfert d'argent"</p>
                          <p><strong>3.</strong> Envoyez{" "}
                            <span className="font-bold">
                              {currency === "CDF"
                                ? getTotalCDF().toLocaleString() + " CDF"
                                : "$" + getTotalUSD().toFixed(2)}
                            </span>{" "}
                            vers: <strong className="text-orange-600">+243 854262383</strong>
                          </p>
                          <p><strong>4.</strong> Téléchargez la preuve de paiement ci-dessous</p>
                        </div>
                      )}
                      {/* Autres instructions similaires pour airtel, mpesa, afrimoney */}
                    </div>
                  </div>
                )}

                {/* Upload preuve de paiement pour paiement manuel */}
                {formData.paymentType === 'manual' && (
                  <div>
                    <Label htmlFor="proof">Preuve de paiement *</Label>
                    <div className="mt-2">
                      <input
                        id="proof"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="proof"
                        className={`cursor-pointer flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg hover:bg-gray-50 transition-colors ${
                          errors.proof ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        {proofPreview ? (
                          <div className="relative w-full h-full">
                            <img
                              src={proofPreview}
                              alt="Aperçu preuve de paiement"
                              className="w-full h-full object-contain rounded-lg"
                            />
                            <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                              <CheckCircle className="w-4 h-4" />
                            </div>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-600 text-center">
                              Cliquez pour télécharger votre preuve de paiement
                              <br />
                              <span className="text-xs text-gray-500">JPEG, PNG (max 5MB)</span>
                            </p>
                          </>
                        )}
                      </label>
                    </div>
                    {errors.proof && (
                      <p className="text-sm text-red-500 mt-1">{errors.proof}</p>
                    )}
                    {proofFile && (
                      <p className="text-sm text-green-600 mt-1 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        {proofFile.name} ({(proofFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                )}

                {/* Notes */}
                <div>
                  <Label htmlFor="notes">Notes (optionnel)</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Informations supplémentaires..."
                    rows={3}
                  />
                </div>

                {/* Progress bar pour upload */}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    isSubmitting || 
                    isProcessingPayment || 
                    !formData.paymentMethod || 
                    (formData.paymentType === 'manual' && !proofFile)
                  }
                >
                  {isSubmitting || isProcessingPayment ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {isProcessingPayment ? 'Redirection CinetPay...' : 
                       uploadProgress > 0 ? `Upload ${uploadProgress}%...` : 'Création en cours...'}
                    </div>
                  ) : (
                    <>
                      {formData.paymentType === 'cinetpay' ? (
                        <>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Payer avec CinetPay
                        </>
                      ) : (
                        'Soumettre la commande'
                      )}
                    </>
                  )}
                </Button>

                {/* Informations sécurité */}
                <div className="text-xs text-gray-500 text-center space-y-2">
                  <div className="flex items-center justify-center space-x-2">
                    <Shield className="w-4 h-4" />
                    <span>Vos informations sont sécurisées et ne seront pas partagées avec des tiers.</span>
                  </div>
                  {formData.paymentType === 'cinetpay' && (
                    <p className="text-blue-600">
                      CinetPay est un processeur de paiement certifié et sécurisé pour l'Afrique.
                    </p>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}