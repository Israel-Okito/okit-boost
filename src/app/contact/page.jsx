import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Mail, Clock, MapPin, Phone, Headphones } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-yellow-400 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Contactez-nous</h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Notre équipe est disponible 24/7 pour répondre à toutes vos questions et vous accompagner dans vos projets
              SMM
            </p>
            <Badge className="bg-green-500 text-white px-4 py-2 text-lg">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                Support en ligne
              </div>
            </Badge>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Choisissez votre moyen de contact</h2>
            <p className="text-xl text-gray-600">
              Nous sommes là pour vous aider de la manière qui vous convient le mieux
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {/* WhatsApp Card */}
            <Card className="hover:shadow-xl transition-shadow duration-300 border-0 shadow-lg">
              <CardHeader className="text-center pb-6">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                  <MessageCircle className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">WhatsApp</CardTitle>
                <CardDescription className="text-lg">
                  Contactez-nous directement sur WhatsApp pour une réponse rapide
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">+243 900 554 141</div>
                  <p className="text-gray-600 mb-6">Cliquez pour ouvrir WhatsApp</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-3 text-green-500" />
                    Réponse sous 5 minutes
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Headphones className="w-4 h-4 mr-3 text-green-500" />
                    Support technique disponible
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MessageCircle className="w-4 h-4 mr-3 text-green-500" />
                    Suivi de commandes en temps réel
                  </div>
                </div>

                <a
                  href="https://wa.me/243900554141?text=Bonjour%20Okit-Boost,%20j'aimerais%20avoir%20des%20informations%20sur%20vos%20services%20SMM"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full bg-green-500 hover:bg-green-600 text-white h-12 text-lg">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Ouvrir WhatsApp
                  </Button>
                </a>
              </CardContent>
            </Card>

            {/* Email Card */}
            <Card className="hover:shadow-xl transition-shadow duration-300 border-0 shadow-lg">
              <CardHeader className="text-center pb-6">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <Mail className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">Email</CardTitle>
                <CardDescription className="text-lg">
                  Envoyez-nous un email pour des demandes détaillées ou des devis personnalisés
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2">contact@okit-boost.com</div>
                  <p className="text-gray-600 mb-6">Cliquez pour ouvrir votre client email</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-3 text-blue-500" />
                    Réponse sous 2 heures
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-3 text-blue-500" />
                    Devis personnalisés
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Headphones className="w-4 h-4 mr-3 text-blue-500" />
                    Support technique avancé
                  </div>
                </div>

                <a
                  href="mailto:contact@okit-boost.com?subject=Demande d'information - Services SMM&body=Bonjour Okit-Boost,%0D%0A%0D%0AJ'aimerais avoir des informations sur vos services SMM.%0D%0A%0D%0AMes besoins:%0D%0A- Plateforme: %0D%0A- Service souhaité: %0D%0A- Budget approximatif: %0D%0A%0D%0AMerci pour votre retour.%0D%0A%0D%0ACordialement"
                  className="block"
                >
                  <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white h-12 text-lg">
                    <Mail className="w-5 h-5 mr-2" />
                    Envoyer un Email
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardContent className="p-6">
                <Clock className="w-8 h-8 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Horaires de support</h3>
                <p className="text-gray-600 text-sm">
                  Lundi - Dimanche
                  <br />
                  24h/24 - 7j/7
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <MapPin className="w-8 h-8 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Localisation</h3>
                <p className="text-gray-600 text-sm">
                  Kinshasa, RDC
                  <br />
                  Service en ligne
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <Phone className="w-8 h-8 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Langues supportées</h3>
                <p className="text-gray-600 text-sm">
                  Français, Lingala
                  <br />
                  Anglais (basique)
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Questions fréquentes ?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Consultez notre FAQ pour trouver rapidement des réponses à vos questions
          </p>
          <Link href="/faq">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Consulter la FAQ
            </Button>
          </Link>
        </div>
      </section>

      {/* Emergency Contact */}
      <section className="py-12 bg-red-50 border-t border-red-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></div>
            <h3 className="text-lg font-semibold text-red-800">Support d'urgence</h3>
          </div>
          <p className="text-red-700 mb-4">
            Pour les problèmes urgents (commandes en cours, paiements, etc.), contactez-nous immédiatement sur WhatsApp
          </p>
          <a
            href="https://wa.me/243900554141?text=🚨%20URGENCE%20-%20Okit-Boost%0D%0A%0D%0ABonjour,%20j'ai%20un%20problème%20urgent%20concernant:"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50 bg-transparent">
              <MessageCircle className="w-4 h-4 mr-2" />
              Contact d'urgence
            </Button>
          </a>
        </div>
      </section>
    </div>
  )
}
