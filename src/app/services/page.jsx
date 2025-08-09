"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, ArrowRight, TrendingUp, Users, Eye, Heart, Star, Clock, Shield } from "lucide-react"
import Image from "next/image"


function PlatformCardSkeleton() {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div>
              <Skeleton className="h-6 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full mb-4" />
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Skeleton className="h-6 w-8 mx-auto mb-1" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Skeleton className="h-6 w-12 mx-auto mb-1" />
            <Skeleton className="h-3 w-20 mx-auto" />
          </div>
        </div>
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  )
}

export default function ServicesPage() {
  const [platforms, setPlatforms] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredPlatforms, setFilteredPlatforms] = useState([])

  useEffect(() => {
    fetchPlatforms()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      setFilteredPlatforms(
        platforms.filter(platform =>
          platform.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          platform.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    } else {
      setFilteredPlatforms(platforms)
    }
  }, [searchTerm, platforms])

  const fetchPlatforms = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/services')
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des plateformes')
      }

      const data = await response.json()
      setPlatforms(data.platforms || [])
    } catch (error) {
      console.error('Error fetching platforms:', error)
    } finally {
      setLoading(false)
    }
  }

  const getServiceIcon = (category) => {
    switch (category.toLowerCase()) {
      case 'views':
      case 'vues':
        return <Eye className="w-5 h-5" />
      case 'followers':
      case 'abonnés':
        return <Users className="w-5 h-5" />
      case 'likes':
        return <Heart className="w-5 h-5" />
      default:
        return <TrendingUp className="w-5 h-5" />
    }

  }


  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Nos Services de Boosting
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Boostez votre présence sur les réseaux sociaux avec nos services de qualité. 
            Choisissez votre plateforme et découvrez nos offres.
          </p>
        </div>

        {/* Barre de recherche */}
        <div className="max-w-md mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Rechercher une plateforme..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl text-center">
            <div className="text-3xl font-bold mb-2">
              {loading ? "..." : filteredPlatforms.length}
            </div>
            <div className="text-blue-100">Plateformes disponibles</div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl text-center">
            <div className="text-3xl font-bold mb-2">100K+</div>
            <div className="text-green-100">Commandes traitées</div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl text-center">
            <div className="text-3xl font-bold mb-2">24/7</div>
            <div className="text-purple-100">Support client</div>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-xl text-center">
            <div className="text-3xl font-bold mb-2">99%</div>
            <div className="text-orange-100">Taux de réussite</div>
          </div>
        </div>

        {/* Avantages */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Pourquoi choisir Okit-Boost ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Sécurisé & Fiable</h3>
              <p className="text-gray-600">
                Tous nos services respectent les conditions d'utilisation des plateformes
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Livraison Rapide</h3>
              <p className="text-gray-600">
                Résultats visibles en quelques heures, selon le service choisi
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Qualité Premium</h3>
              <p className="text-gray-600">
                Engagement authentique et de haute qualité pour tous nos services
              </p>
            </div>
          </div>
        </div>

        {/* Plateformes */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, index) => (
              <PlatformCardSkeleton key={index} />
            ))}
          </div>
        ) : filteredPlatforms.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">
              {searchTerm ? 'Aucune plateforme trouvée' : 'Aucune plateforme disponible'}
            </div>
            {searchTerm && (
              <Button variant="outline" onClick={() => setSearchTerm("")}>
                Afficher toutes les plateformes
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPlatforms.map((platform) => (
              <Card key={platform.id} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-lg"
                        style={{
                          background: platform.color_from && platform.color_to 
                            ? `linear-gradient(135deg, ${platform.color_from}, ${platform.color_to})`
                            : '#3B82F6'
                        }}
                      >
                         {platform.icon_url.toLowerCase() === "facebook" && (
                            <Image src="/facebook.webp" alt={platform.name} width={32} height={32} className="object-contain filter " />
                          )}
                          {platform.icon_url.toLowerCase() === "instagram" && (
                            <Image src="/instagram.webp" alt={platform.name} width={32} height={32} className="object-contain filter " />
                          )}
                          {platform.icon_url.toLowerCase() === "tiktok" && (
                            <Image src="/tiktok.webp" alt={platform.name} width={32} height={32} className="object-contain filter " />
                          )}
                          {platform.icon_url.toLowerCase() === "youtube" && (
                            <Image src="/youtube.webp" alt={platform.name} width={32} height={32} className="object-contain filter " />
                          )}

                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-gray-900">
                          {platform.name}
                        </CardTitle>
                        <Badge variant="secondary" className="mt-1">
                          {platform.services_count || 0} services
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 mb-6 leading-relaxed">
                    {platform.description}
                  </CardDescription>

                  {/* Services populaires */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                      <div className="flex items-center justify-center mb-1">
                        <Eye className="w-4 h-4 text-blue-600 mr-1" />
                        <span className="text-lg font-semibold text-blue-700">Vues</span>
                      </div>
                      <div className="text-xs text-blue-600">Populaire</div>
                    </div>
                    <div className="text-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                      <div className="flex items-center justify-center mb-1">
                        <Users className="w-4 h-4 text-green-600 mr-1" />
                        <span className="text-lg font-semibold text-green-700">Abonnés</span>
                      </div>
                      <div className="text-xs text-green-600">Tendance</div>
                    </div>
                  </div>

                  {/* Prix à partir de */}
                  {platform.min_price && (
                    <div className="mb-6 p-3 bg-gray-50 rounded-lg text-center">
                      <div className="text-sm text-gray-600">À partir de</div>
                      <div className="text-lg font-bold text-gray-900">
                        {platform.min_price.toLocaleString()} CDF
                      </div>
                    </div>
                  )}

                  <Link href={`/services/${platform.id}`}>
                    <Button className="w-full group-hover:bg-blue-700 transition-colors duration-200">
                      Voir les services
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Section FAQ */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Questions fréquentes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Combien de temps prend la livraison ?
              </h3>
              <p className="text-gray-600">
                La plupart de nos services sont livrés en 1-24h. Le temps exact dépend du service et de la quantité commandée.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Vos services sont-ils sûrs ?
              </h3>
              <p className="text-gray-600">
                Oui, tous nos services respectent les conditions d'utilisation des plateformes et utilisent des méthodes sûres.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Puis-je obtenir un remboursement ?
              </h3>
              <p className="text-gray-600">
                Nous offrons une garantie de remboursement si nous ne pouvons pas livrer votre commande comme promis.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Comment puis-je payer ?
              </h3>
              <p className="text-gray-600">
                Nous acceptons les paiements via Mobile Money (Orange Money, Airtel Money, M-Pesa) pour votre commodité.
              </p>
            </div>
          </div>
        </div>

        {/* Section CTA */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Prêt à booster votre présence ?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Rejoignez des milliers de créateurs qui font confiance à Okit-Boost pour développer leur audience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/formulaire-dessai">
              <Button size="lg" variant="outline" className="bg-white text-blue-600 hover:bg-gray-100">
                Essai gratuit
              </Button>
            </Link>
            <Link href="/connexion">
              <Button size="lg" className="bg-blue-700 hover:bg-blue-800">
                Créer un compte
              </Button>
            </Link>
          </div>
        </div>

        {/* Section témoignages */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Ce que disent nos clients
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-4 italic">
                "Service rapide et efficace ! Mes vues TikTok ont explosé en quelques heures."
              </p>
              <div className="font-semibold text-gray-900">Marie K.</div>
              <div className="text-sm text-gray-500">Créatrice de contenu</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-4 italic">
                "Excellent support client et résultats garantis. Je recommande vivement !"
              </p>
              <div className="font-semibold text-gray-900">Jean-Paul M.</div>
              <div className="text-sm text-gray-500">Influenceur Instagram</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-4 italic">
                "Qualité premium à prix abordable. Parfait pour faire décoller ma chaîne YouTube."
              </p>
              <div className="font-semibold text-gray-900">Sarah L.</div>
              <div className="text-sm text-gray-500">YouTubeuse</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}