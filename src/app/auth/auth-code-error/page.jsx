"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AuthCodeErrorPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <CardTitle className="text-2xl text-red-600">Erreur d'authentification</CardTitle>
          <CardDescription>
            Une erreur est survenue lors de la connexion. Veuillez réessayer.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600 text-center space-y-2">
            <p>
              Le processus d'authentification a échoué ou a été interrompu.
            </p>
            <p>
              Cela peut arriver si vous avez annulé la connexion ou si une erreur temporaire s'est produite.
            </p>
          </div>
          
          <div className="space-y-2">
            <Button 
              onClick={() => router.push('/connexion')}
              className="w-full"
            >
              Réessayer la connexion
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => router.push('/')}
              className="w-full"
            >
              Retour à l'accueil
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}