"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Star, Gift, CheckCircle, Lock, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/hooks/useAuth"
import Link from "next/link"

export default function TrialFormPage() {
  const { user, profile, loading } = useAuth()
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
  const [hasExistingRequest, setHasExistingRequest] = useState(false)
  const [checkingExisting, setCheckingExisting] = useState(false)

  // Vérifier si l'utilisateur a déjà fait une demande
  useEffect(() => {
    if (user && !loading) {
      checkExistingRequest()
      // Pré-remplir le formulaire avec les infos du profil
      setFormData(prev => ({
        ...prev,
        name: profile?.full_name || "",
        email: user.email || "",
        phone: profile?.phone || ""
      }))
    }
  }, [user, profile, loading])

  const checkExistingRequest = async () => {
    if (!user) return
    
    setCheckingExisting(true)
    try {
      const response = await fetch('/api/trial-requests/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: user.email })
      })

      const result = await response.json()
      
      if (response.ok) {
        setHasExistingRequest(result.hasExisting)
      }
    } catch (error) {
      console.error('Error checking existing request:', error)
    } finally {
      setCheckingExisting(false)
    }
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!user) {
      toast.error('Veuillez vous connecter pour faire une demande d\'essai')
      return
    }

    if (hasExistingRequest) {
      toast.error('Vous avez déjà fait une demande d\'essai')
      return
    }

    setIsSubmitting(true)
  
    try {
      const response = await fetch('/api/trial-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          user_id: user.id
        })
      })
  
      const result = await response.json()
  
      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la soumission')
      }
  
      toast.success('Demande d\'essai envoyée avec succès!')
      setHasExistingRequest(true)
  
      // Reset form
      setFormData({
        name: profile?.full_name || "",
        email: user.email || "",
        phone: profile?.phone || "",
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  // Si l'utilisateur n'est pas connecté
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Connexion requise</h1>
          <p className="text-xl text-gray-600 mb-8">
            Vous devez être connecté pour faire une demande d'essai gratuit
          </p>
          <div className="space-x-4">
            <Link href="/connexion">
              <Button size="lg">
                Se connecter
              </Button>
            </Link>
          </div>
        </div>

        {/* Benefits - Toujours affichés */}
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
      </div>
    )
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
        
        {checkingExisting && (
          <div className="mt-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Vérification...</p>
          </div>
        )}
      </div>

      {/* Alerte si demande existante */}
      {hasExistingRequest && !checkingExisting && (
        <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
            <div>
              <h3 className="font-medium text-yellow-800">Demande d'essai déjà effectuée</h3>
              <p className="text-sm text-yellow-700">
                Vous avez déjà fait une demande d'essai. Consultez votre compte pour voir le statut.
              </p>
            </div>
          </div>
        </div>
      )}

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
                  disabled={hasExistingRequest}
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
                  disabled={true} // Toujours désactivé car c'est l'email de l'utilisateur connecté
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
                disabled={hasExistingRequest}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="platform">Plateforme *</Label>
                <Select
                  value={formData.platform}
                  onValueChange={(value) => setFormData({ ...formData, platform: value, service: "" })}
                  disabled={hasExistingRequest}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisissez une plateforme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="service">Service souhaité *</Label>
                <Select
                  value={formData.service}
                  onValueChange={(value) => setFormData({ ...formData, service: value })}
                  disabled={hasExistingRequest}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisissez un service" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.platform === "tiktok" && (
                      <>
                        <SelectItem value="tiktok-views">Vues TikTok <span className="text-blue-500"> (seulement 20 vues)</span></SelectItem>
                        <SelectItem value="tiktok-followers">Followers TikTok <span className="text-blue-500"> (seulement 20 followers)</span></SelectItem>
                        <SelectItem value="tiktok-likes">Likes TikTok <span className="text-blue-500">(seulement 20 likes)</span></SelectItem>
                      </>
                    )}
                    {formData.platform === "instagram" && (
                      <>
                        <SelectItem value="instagram-followers">Followers Instagram <span className="text-blue-500">(seulement 20 Followers)</span></SelectItem>
                        <SelectItem value="instagram-likes">Likes Instagram <span className="text-blue-500">(seulement 20 likes)</span></SelectItem>
                        <SelectItem value="instagram-views">Vues Instagram <span className="text-blue-500">(seulement 20 vues)</span></SelectItem>
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
                disabled={hasExistingRequest}
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
                disabled={hasExistingRequest}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting || hasExistingRequest || checkingExisting}
            >
              {isSubmitting ? "Envoi en cours..." : 
               hasExistingRequest ? "Vous avez déjà fait une demande" :
               "Demander un essai gratuit"}
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
              Vous pouvez demander un essai par compte utilisateur pour tester la qualité.
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