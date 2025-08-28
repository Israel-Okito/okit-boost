import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Star, Zap, Shield, Users } from "lucide-react"
import { platforms } from "@/data/services"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-950 via-purple-900 to-yellow-400 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Boostez votre présence sur les
              <span className="bg-gradient-to-r from-yellow-400 to-orange-300 bg-clip-text text-transparent">
                {" "}
                réseaux sociaux
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Services de boostage de qualité pour TikTok, Instagram, Facebook et YouTube. Paiement sécurisé via Mobile Money. Support
              24/7.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/services">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 cursor-pointer">
                  <Zap className="w-5 h-5 mr-2" />
                  Commander maintenant
                </Button>
              </Link>
              <Link href="/formulaire-dessai">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-blue-600 bg-transparent cursor-pointer"
                >
                  <Star className="w-5 h-5 mr-2" />
                  Essai gratuit
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Platforms Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Nos plateformes supportées</h2>
            <p className="text-xl text-gray-600">Choisissez la plateforme que vous souhaitez booster</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {platforms.map((platform) => (
              <Card key={platform.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="text-center">
                  <div
                    className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${platform.color} flex items-center justify-center text-2xl`}
                  >
                    {platform.icon}
                  </div>
                  <CardTitle className="text-2xl">{platform.name}</CardTitle>
                  <CardDescription className="text-gray-600">{platform.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Link href={`/services`}>
                    <Button className="w-full">Voir les services</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Pourquoi choisir Okit-Boost ?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">100% Sécurisé</h3>
              <p className="text-gray-600">Paiements sécurisés via Mobile Money. Vos données sont protégées.</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Livraison Rapide</h3>
              <p className="text-gray-600">Vos commandes sont traitées rapidement, résultats visibles immédiatement.</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Support 24/7</h3>
              <p className="text-gray-600">Notre équipe est disponible 24h/24 pour vous accompagner.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-yellow-400 mb-2">1K+</div>
              <div className="text-gray-400">Clients satisfaits</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-yellow-400 mb-2">50K+</div>
              <div className="text-gray-400">Commandes traitées</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-yellow-400 mb-2">99%</div>
              <div className="text-gray-400">Taux de satisfaction</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-yellow-400 mb-2">24/7</div>
              <div className="text-gray-400">Support client</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Ce que disent nos clients</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "Service excellent ! Mes vues TikTok ont explosé en quelques heures. Je recommande vivement
                  Okit-Boost."
                </p>
                <div className="font-semibold">Maria</div>
                <div className="text-sm text-gray-500">Influenceuse TikTok</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "Paiement facile via Orange Money. Le support client est très réactif. Parfait pour booster mon
                  Instagram."
                </p>
                <div className="font-semibold">Jean k.</div>
                <div className="text-sm text-gray-500">Content Creator</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "Ma chaîne YouTube a enfin décollé grâce à Okit-Boost. Prix abordables et résultats garantis."
                </p>
                <div className="font-semibold">Sarah</div>
                <div className="text-sm text-gray-500">YouTubeuse</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-950 via-purple-900 to-yellow-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Prêt à booster votre présence ?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Rejoignez des milliers de créateurs qui font confiance à Okit-Boost
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/services">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                Commencer maintenant
              </Button>
            </Link>
            <a href="https://wa.me/243900554141" target="_blank" rel="noopener noreferrer">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-blue-600 bg-transparent"
              >
                Contacter sur WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
