import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-600">Erreur de connexion</CardTitle>
          <CardDescription>
            Une erreur est survenue lors de la connexion avec Google. Veuillez réessayer.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-gray-600">
            Si le problème persiste, contactez notre support à{" "}
            <a href="mailto:support@okit-boost.com" className="text-blue-600 hover:text-blue-500">
              support@okit-boost.com
            </a>
          </p>
          <div className="space-y-2">
            <Link href="/connexion" className="block">
              <Button className="w-full">Réessayer la connexion</Button>
            </Link>
            <Link href="/" className="block">
              <Button variant="outline" className="w-full bg-transparent">
                Retour à l'accueil
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
