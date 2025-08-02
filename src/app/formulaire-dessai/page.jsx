"use client"

import  React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Star, Gift, CheckCircle } from "lucide-react"
import { toast } from "sonner"


export default function TrialFormPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    platform: "",
    service: "",
    target_link: "",
    notes: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
  
    try {
      const response = await fetch('/api/trial-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
  
      const result = await response.json()
  
      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la soumission')
      }
  
      toast.success('Demande d\'essai envoyée avec succès!')
  
      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        platform: "",
        service: "",
        target_link: "",
        notes: "",
      })
    } catch (error) {
      console.error('Error submitting trial:', error)
      toast.error(error.message || 'Erreur lors de l\'envoi')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
          <Gift className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Essai gratuit</h1>
        <p className="text-xl text-gray-600">Testez nos services gratuitement avant de commander</p>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="text-center p-6 bg-green-50 rounded-lg">
          <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-3" />
          <h3 className="font-semibold text-green-800 mb-2">100% Gratuit</h3>
          <p className="text-sm text-green-700">Aucun frais, aucune carte de crédit requise</p>
        </div>
        <div className="text-center p-6 bg-blue-50 rounded-lg">
          <Star className="w-8 h-8 text-blue-600 mx-auto mb-3" />
          <h3 className="font-semibold text-blue-800 mb-2">Qualité Premium</h3>
          <p className="text-sm text-blue-700">Même qualité que nos services payants</p>
        </div>
        <div className="text-center p-6 bg-purple-50 rounded-lg">
          <Gift className="w-8 h-8 text-purple-600 mx-auto mb-3" />
          <h3 className="font-semibold text-purple-800 mb-2">Livraison Rapide</h3>
          <p className="text-sm text-purple-700">Résultats visibles sous 24h</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Demander un essai gratuit</CardTitle>
          <CardDescription>Complétez le formulaire ci-dessous pour recevoir votre essai gratuit</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="platform">Plateforme *</Label>
                <Select
                  value={formData.platform}
                  onValueChange={(value) => setFormData({ ...formData, platform: value, service: "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisissez une plateforme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="service">Service souhaité *</Label>
                <Select
                  value={formData.service}
                  onValueChange={(value) => setFormData({ ...formData, service: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisissez un service" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.platform === "tiktok" && (
                      <>
                        <SelectItem value="tiktok-views">Vues TikTok</SelectItem>
                        <SelectItem value="tiktok-followers">Followers TikTok</SelectItem>
                        <SelectItem value="tiktok-likes">Likes TikTok</SelectItem>
                      </>
                    )}
                    {formData.platform === "instagram" && (
                      <>
                        <SelectItem value="instagram-followers">Followers Instagram</SelectItem>
                        <SelectItem value="instagram-likes">Likes Instagram</SelectItem>
                        <SelectItem value="instagram-views">Vues Instagram</SelectItem>
                      </>
                    )}
                    {formData.platform === "youtube" && (
                      <>
                        <SelectItem value="youtube-views">Vues YouTube</SelectItem>
                        <SelectItem value="youtube-subscribers">Abonnés YouTube</SelectItem>
                        <SelectItem value="youtube-likes">Likes YouTube</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="target_link">Lien cible *</Label>
              <Input
                id="target_link"
                name="target_link"
                value={formData.target_link}
                onChange={handleInputChange}
                required
                placeholder="Lien vers votre profil, vidéo ou post"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes supplémentaires (optionnel)</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Informations supplémentaires sur votre demande..."
                rows={4}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Envoi en cours..." : "Demander un essai gratuit"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* FAQ */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Questions fréquentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Combien de temps prend l'essai ?</h3>
            <p className="text-gray-600">
              Les essais sont généralement livrés sous 24h après validation de votre demande.
            </p>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Puis-je demander plusieurs essais ?</h3>
            <p className="text-gray-600">
              Vous pouvez demander un essai par plateforme et par service pour tester la qualité.
            </p>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">L'essai est-il vraiment gratuit ?</h3>
            <p className="text-gray-600">Oui, l'essai est 100% gratuit sans aucune obligation d'achat.</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Comment savoir si mon essai est accepté ?</h3>
            <p className="text-gray-600">
              Vous recevrez un email de confirmation et notre équipe vous contactera par WhatsApp.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
