"use client"

import React, { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowLeft, 
  Home,
  Package
} from 'lucide-react'
import PaymentStatusTracker from '@/components/payment/PaymentStatusTracker'
import { toast } from 'sonner'

// Composant interne pour gérer les paramètres de recherche
function PaymentStatusContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [transactionId, setTransactionId] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Récupération des paramètres depuis l'URL
    const txId = searchParams.get('transaction_id') || searchParams.get('transactionId')
    const statusParam = searchParams.get('status')
    
    if (txId) {
      setTransactionId(txId)
    }
    
    if (statusParam) {
      setStatus(statusParam)
    }

    // Vérifier le localStorage pour les données de transaction
    const savedTransaction = localStorage.getItem('cinetpay_transaction')
    if (savedTransaction) {
      try {
        const transactionData = JSON.parse(savedTransaction)
        if (!txId && transactionData.transactionId) {
          setTransactionId(transactionData.transactionId)
        }
        
        // Nettoyer le localStorage après récupération
        localStorage.removeItem('cinetpay_transaction')
      } catch (error) {
        console.error('Erreur parsing transaction data:', error)
      }
    }

    setLoading(false)
  }, [searchParams])

  const handleStatusChange = (newStatus, transactionData) => {
    setStatus(newStatus)
    
    // Redirection automatique vers le compte utilisateur si paiement réussi
    if (newStatus === 'completed') {
      setTimeout(() => {
        router.push('/mon-compte')
      }, 3000) // Redirection après 3 secondes
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du statut de paiement...</p>
        </div>
      </div>
    )
  }

  if (!transactionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="flex items-center justify-center space-x-2 text-red-600">
                <XCircle className="w-6 h-6" />
                <span>Transaction introuvable</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Aucun ID de transaction n'a été fourni. 
                Cela peut arriver si vous avez accédé directement à cette page.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={() => router.push('/services')}
                  className="flex items-center space-x-2"
                >
                  <Package className="w-4 h-4" />
                  <span>Voir nos services</span>
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => router.push('/')}
                  className="flex items-center space-x-2"
                >
                  <Home className="w-4 h-4" />
                  <span>Retour à l'accueil</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour</span>
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Statut de votre Paiement
          </h1>
          <p className="text-gray-600">
            Suivez en temps réel l'évolution de votre transaction
          </p>
        </div>

        {/* Tracker de statut */}
        <PaymentStatusTracker 
          transactionId={transactionId}
          onStatusChange={handleStatusChange}
        />

        {/* Actions selon le statut */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          {status === 'completed' && (
            <Button 
              onClick={() => router.push('/mon-compte')}
              className="flex items-center space-x-2"
            >
              <Package className="w-4 h-4" />
              <span>Voir mes commandes</span>
            </Button>
          )}
          
          {(status === 'failed' || status === 'cancelled') && (
            <Button 
              onClick={() => router.push('/caisse')}
              className="flex items-center space-x-2"
            >
              <Package className="w-4 h-4" />
              <span>Réessayer le paiement</span>
            </Button>
          )}
          
          <Button 
            variant="outline"
            onClick={() => router.push('/services')}
            className="flex items-center space-x-2"
          >
            <Package className="w-4 h-4" />
            <span>Continuer mes achats</span>
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => router.push('/')}
            className="flex items-center space-x-2"
          >
            <Home className="w-4 h-4" />
            <span>Retour à l'accueil</span>
          </Button>
        </div>

        {/* Informations d'aide */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Besoin d'aide ?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Paiement en cours</h4>
                <p className="text-gray-600">
                  Si votre paiement est en cours, patientez quelques minutes. 
                  Le statut sera mis à jour automatiquement.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Problème de paiement</h4>
                <p className="text-gray-600">
                  En cas d'échec, vérifiez votre solde et les informations de paiement, 
                  puis réessayez.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Support client</h4>
                <p className="text-gray-600">
                  Contactez notre support avec votre ID de transaction 
                  pour une assistance personnalisée.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Délais de traitement</h4>
                <p className="text-gray-600">
                  Les paiements Mobile Money sont généralement traités 
                  en quelques minutes.
                </p>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" size="sm">
                  Contacter le support
                </Button>
                <Button variant="outline" size="sm">
                  FAQ Paiements
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Composant principal avec Suspense
export default function PaymentStatusPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <PaymentStatusContent />
    </Suspense>
  )
}
