"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  CheckCircle, 
  Clock, 
  Home, 
  User, 
  FileText,
  Shield,
  ArrowRight
} from "lucide-react"

export default function ManualPaymentSuccessPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        {/* Icône de succès */}
        <div className="mb-8">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Commande créée avec succès !
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Votre commande a été créée et est en attente de vérification
          </p>
        </div>

        {/* Carte principale */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm mb-8">
          <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center justify-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Statut de votre commande</span>
            </CardTitle>
            <CardDescription className="text-white/90">
              Votre preuve de paiement a été reçue
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Statut */}
              <div className="flex items-center justify-center space-x-3">
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 px-4 py-2">
                  <Clock className="w-4 h-4 mr-2" />
                  En attente de vérification
                </Badge>
              </div>

              {/* Informations importantes */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Temps de vérification</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Notre équipe vérifiera votre preuve de paiement sous <strong>30 minutes</strong>. 
                      Vous recevrez une notification dès que votre commande sera confirmée.
                    </p>
                  </div>
                </div>
              </div>

              {/* Prochaines étapes */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Prochaines étapes :</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Vérification de la preuve de paiement</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Confirmation de la commande</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Début du traitement de vos services</span>
                  </div>
                </div>
              </div>

              {/* Informations de sécurité */}
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900">Sécurité garantie</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Votre preuve de paiement est sécurisée et ne sera utilisée que pour la vérification de votre commande.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            onClick={() => router.push("/mon-compte")}
            className="flex items-center space-x-2 px-6 py-3"
            size="lg"
          >
            <User className="w-5 h-5" />
            <span>Voir mes commandes</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push("/")}
            className="flex items-center space-x-2"
            size="lg"
          >
            <Home className="w-4 h-4" />
            <span>Retour à l'accueil</span>
          </Button>
        </div>

        {/* Informations supplémentaires */}
        <div className="mt-12 text-sm text-gray-500">
          <p>
            Si vous avez des questions, contactez notre support client via le chat en ligne ou par email.
          </p>
        </div>
      </div>
    </div>
  )
}
