"use client"

import  React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, CreditCard, Trash2 } from "lucide-react"
import { useCart } from "@/hooks/useCart"
import { toast } from "sonner"

export default function CheckoutPage() {
  const router = useRouter()
  const { items, removeItem, clearCart, getTotalUSD, getTotalCDF } = useCart()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    paymentMethod: "",
    notes: "",
  })

  const [proofFile, setProofFile] = useState(null)
  const [currency, setCurrency] = useState("CDF")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProofFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast.custom((t) => (
        <div className="bg-green-600 text-white p-2 rounded-lg shadow-lg">
          <strong className="text-lg">Commande soumise</strong>
          <div>Votre commande a été envoyée avec succès. Vous recevrez une confirmation par email.</div>
        </div>
      ));

      clearCart()
      router.push("/mon-compte")
    } catch (error) {
      toast.custom((t) => (
        <div className="bg-red-600 text-white p-2 rounded-lg shadow-lg">
          <strong className="text-lg">Erreur</strong>
          <div>Une erreur est survenue lors de la soumission.</div>
        </div>
      ));
    } finally {
      setIsSubmitting(false)
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
        {/* Order Summary */}
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
                  <div key={item.service_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.service_name}</h3>
                      <p className="text-sm text-gray-600">
                        {item.platform.charAt(0).toUpperCase() + item.platform.slice(1)}
                      </p>
                      <p className="text-sm text-gray-600">Quantité: {item.quantity.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 truncate">{item.target_link}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {currency === "CDF"
                          ? `${item.total_cdf.toLocaleString()} CDF`
                          : `$${item.total_usd.toFixed(2)}`}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.service_id)}
                        className="text-red-600 hover:text-red-800"
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
                  Total: {currency === "CDF" ? `${getTotalCDF().toLocaleString()} CDF` : `$${getTotalUSD().toFixed(2)}`}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Form */}
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
                {/* Personal Information */}
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
                    />
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
                    />
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
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <Label htmlFor="paymentMethod">Moyen de paiement *</Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisissez votre moyen de paiement" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="orange">Orange Money</SelectItem>
                      <SelectItem value="airtel">Airtel Money</SelectItem>
                      <SelectItem value="mpesa">M-Pesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment Instructions */}
                {formData.paymentMethod && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Instructions de paiement</h4>
                    <div className="text-sm text-blue-700">
                      {formData.paymentMethod === "orange" && (
                        <div>
                          <p>1. Composez *144# sur votre téléphone</p>
                          <p>2. Choisissez "Transfert d'argent"</p>
                          <p>
                            3. Envoyez{" "}
                            {currency === "CDF"
                              ? getTotalCDF().toLocaleString() + " CDF"
                              : "$" + getTotalUSD().toFixed(2)}{" "}
                            vers: <strong>+243 XXX XXX XXX</strong>
                          </p>
                          <p>4. Téléchargez la preuve de paiement ci-dessous</p>
                        </div>
                      )}
                      {formData.paymentMethod === "airtel" && (
                        <div>
                          <p>1. Composez *901# sur votre téléphone</p>
                          <p>2. Choisissez "Transfert d'argent"</p>
                          <p>
                            3. Envoyez{" "}
                            {currency === "CDF"
                              ? getTotalCDF().toLocaleString() + " CDF"
                              : "$" + getTotalUSD().toFixed(2)}{" "}
                            vers: <strong>+243 XXX XXX XXX</strong>
                          </p>
                          <p>4. Téléchargez la preuve de paiement ci-dessous</p>
                        </div>
                      )}
                      {formData.paymentMethod === "mpesa" && (
                        <div>
                          <p>1. Ouvrez l'application M-Pesa</p>
                          <p>2. Choisissez "Transfert d'argent"</p>
                          <p>
                            3. Envoyez{" "}
                            {currency === "CDF"
                              ? getTotalCDF().toLocaleString() + " CDF"
                              : "$" + getTotalUSD().toFixed(2)}{" "}
                            vers: <strong>+243 XXX XXX XXX</strong>
                          </p>
                          <p>4. Téléchargez la preuve de paiement ci-dessous</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Proof Upload */}
                <div>
                  <Label htmlFor="proof">Preuve de paiement *</Label>
                  <Input id="proof" type="file" accept="image/*" onChange={handleFileChange} required />
                  <p className="text-sm text-gray-600 mt-1">Téléchargez une capture d'écran ou photo de votre reçu</p>
                </div>

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

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || !formData.paymentMethod || !proofFile}
                >
                  {isSubmitting ? "Envoi en cours..." : "Soumettre la commande"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
