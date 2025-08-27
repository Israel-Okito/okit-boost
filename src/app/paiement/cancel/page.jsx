"use client"

import { Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  XCircle, 
  ArrowLeft,
  RefreshCw,
  MessageCircle
} from "lucide-react"

function PaymentCancelContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const transactionId = searchParams.get('transaction_id')

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <XCircle className="w-16 h-16 mx-auto mb-4 text-orange-500" />
          <CardTitle className="text-2xl text-orange-600">Paiement annulé</CardTitle>
          <CardDescription>
            Votre paiement a été annulé. Aucun montant n'a été débité de votre compte.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {transactionId && (
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <span className="text-sm text-gray-600">Transaction ID:</span>
              <div className="font-mono text-sm bg-white px-2 py-1 rounded mt-1">
                {transactionId}
              </div>
            </div>
          )}
          
          <div className="text-sm text-gray-600 text-center space-y-2">
            <p>
              Vous pouvez réessayer le paiement ou choisir une autre méthode de paiement.
            </p>
            <p>
              Si vous rencontrez des difficultés, notre équipe support est là pour vous aider.
            </p>
          </div>
          
          <div className="space-y-2">
            <Button 
              onClick={() => router.push('/caisse')}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Réessayer le paiement
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => router.push('/mon-compte')}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à mes commandes
            </Button>
            
            <Button 
              variant="outline"
              asChild
              className="w-full"
            >
              <a href="mailto:support@okit-boost.com">
                <MessageCircle className="w-4 h-4 mr-2" />
                Contacter le support
              </a>
            </Button>
          </div>
          
          <div className="text-center">
            <Button 
              variant="ghost"
              onClick={() => router.push('/')}
              className="text-sm"
            >
              Retour à l'accueil
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <PaymentCancelContent />
    </Suspense>
  )
}