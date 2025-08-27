"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  CreditCard,
  Smartphone,
  ExternalLink,
  Copy,
  Eye
} from 'lucide-react'
import { toast } from 'sonner'

const PaymentStatusTracker = ({ transactionId, onStatusChange }) => {
  const [status, setStatus] = useState('pending')
  const [loading, setLoading] = useState(false)
  const [transactionData, setTransactionData] = useState(null)
  const [progress, setProgress] = useState(25)
  const [lastChecked, setLastChecked] = useState(null)
  const [autoCheck, setAutoCheck] = useState(true)

  // Statuts possibles et leurs informations
  const statusConfig = {
    pending: {
      label: 'En attente',
      description: 'Transaction en cours de traitement',
      color: 'bg-yellow-100 text-yellow-800',
      icon: Clock,
      progress: 25
    },
    processing: {
      label: 'En cours',
      description: 'Paiement en cours de vérification',
      color: 'bg-blue-100 text-blue-800',
      icon: RefreshCw,
      progress: 50
    },
    completed: {
      label: 'Réussi',
      description: 'Paiement confirmé avec succès',
      color: 'bg-green-100 text-green-800',
      icon: CheckCircle,
      progress: 100
    },
    failed: {
      label: 'Échoué',
      description: 'Paiement refusé ou échoué',
      color: 'bg-red-100 text-red-800',
      icon: AlertTriangle,
      progress: 0
    },
    cancelled: {
      label: 'Annulé',
      description: 'Transaction annulée par l\'utilisateur',
      color: 'bg-gray-100 text-gray-800',
      icon: AlertTriangle,
      progress: 0
    }
  }

  /**
   * Vérifie le statut de la transaction
   */
  const checkTransactionStatus = useCallback(async () => {
    if (!transactionId) return

    try {
      setLoading(true)
      
      const response = await fetch(`/api/payments/cinetpay/status?transactionId=${transactionId}`)
      const data = await response.json()

      if (response.ok && data.success) {
        const newStatus = data.status
        const newData = data.transaction

        setStatus(newStatus)
        setTransactionData(newData)
        setProgress(statusConfig[newStatus]?.progress || 25)
        setLastChecked(new Date())

        // Notifier le parent du changement de statut
        if (onStatusChange) {
          onStatusChange(newStatus, newData)
        }

        // Notifications
        if (newStatus === 'completed') {
          toast.success('Paiement confirmé avec succès!')
          setAutoCheck(false) // Arrêter la vérification automatique
        } else if (newStatus === 'failed') {
          toast.error('Le paiement a échoué')
          setAutoCheck(false)
        } else if (newStatus === 'cancelled') {
          toast.warning('Paiement annulé')
          setAutoCheck(false)
        }
      } else {
        throw new Error(data.error || 'Erreur lors de la vérification')
      }
    } catch (error) {
      console.error('Erreur vérification statut:', error)
      toast.error('Erreur lors de la vérification du statut')
    } finally {
      setLoading(false)
    }
  }, [transactionId, onStatusChange])

  /**
   * Copie l'ID de transaction
   */
  const copyTransactionId = () => {
    navigator.clipboard.writeText(transactionId)
    toast.success('ID de transaction copié')
  }

  /**
   * Ouvre les détails de la transaction
   */
  const viewTransactionDetails = () => {
    if (transactionData?.paymentUrl) {
      window.open(transactionData.paymentUrl, '_blank')
    }
  }

  // Vérification automatique du statut
  useEffect(() => {
    if (!autoCheck || !transactionId) return

    // Vérification immédiate
    checkTransactionStatus()

    // Vérifications périodiques (toutes les 5 secondes)
    const interval = setInterval(() => {
      if (status === 'pending' || status === 'processing') {
        checkTransactionStatus()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [autoCheck, transactionId, status, checkTransactionStatus])

  // Arrêter la vérification automatique après 10 minutes
  useEffect(() => {
    const timeout = setTimeout(() => {
      setAutoCheck(false)
      toast.warning('Vérification automatique arrêtée. Veuillez vérifier manuellement.')
    }, 10 * 60 * 1000) // 10 minutes

    return () => clearTimeout(timeout)
  }, [])

  if (!transactionId) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Aucun ID de transaction fourni
        </AlertDescription>
      </Alert>
    )
  }

  const currentStatusConfig = statusConfig[status] || statusConfig.pending

  return (
    <div className="space-y-4">
      {/* Statut principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5" />
            <span>Statut du Paiement</span>
          </CardTitle>
          <CardDescription>
            Suivi en temps réel de votre transaction
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Barre de progression */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Progression</span>
              <span className="text-sm text-gray-600">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Statut actuel */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <currentStatusConfig.icon 
                className={`w-6 h-6 ${
                  status === 'processing' ? 'animate-spin' : ''
                } ${
                  status === 'completed' ? 'text-green-600' :
                  status === 'failed' || status === 'cancelled' ? 'text-red-600' :
                  status === 'processing' ? 'text-blue-600' :
                  'text-yellow-600'
                }`} 
              />
              <div>
                <div className="font-medium">{currentStatusConfig.label}</div>
                <div className="text-sm text-gray-600">{currentStatusConfig.description}</div>
              </div>
            </div>
            <Badge className={currentStatusConfig.color}>
              {currentStatusConfig.label}
            </Badge>
          </div>

          {/* ID de transaction */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div>
              <div className="text-sm font-medium">ID de Transaction</div>
              <div className="text-xs text-gray-600 font-mono">{transactionId}</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyTransactionId}
              className="flex items-center space-x-1"
            >
              <Copy className="w-3 h-3" />
              <span>Copier</span>
            </Button>
          </div>

          {/* Dernière vérification */}
          {lastChecked && (
            <div className="text-xs text-gray-500 text-center">
              Dernière vérification: {lastChecked.toLocaleTimeString('fr-FR')}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={checkTransactionStatus}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </Button>

            {transactionData?.paymentUrl && (
              <Button
                variant="outline"
                onClick={viewTransactionDetails}
                className="flex items-center space-x-2"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Voir détails</span>
              </Button>
            )}

            <Button
              variant={autoCheck ? "destructive" : "default"}
              onClick={() => setAutoCheck(!autoCheck)}
              size="sm"
            >
              {autoCheck ? 'Arrêter' : 'Reprendre'} auto-vérification
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Détails de la transaction */}
      {transactionData && (
        <Card>
          <CardHeader>
            <CardTitle>Détails de la Transaction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {transactionData.amount && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Montant:</span>
                <span className="font-medium">
                  {transactionData.amount} {transactionData.currency}
                </span>
              </div>
            )}
            
            {transactionData.paymentMethod && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Méthode:</span>
                <div className="flex items-center space-x-1">
                  <Smartphone className="w-4 h-4" />
                  <span className="font-medium capitalize">{transactionData.paymentMethod}</span>
                </div>
              </div>
            )}

            {transactionData.customerEmail && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Email:</span>
                <span className="font-medium">{transactionData.customerEmail}</span>
              </div>
            )}

            {transactionData.createdAt && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Créé le:</span>
                <span className="font-medium">
                  {new Date(transactionData.createdAt).toLocaleString('fr-FR')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions selon le statut */}
      {status === 'pending' && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            <strong>En attente de paiement</strong><br />
            Veuillez compléter le paiement sur votre application mobile money.
            Le statut sera mis à jour automatiquement.
          </AlertDescription>
        </Alert>
      )}

      {status === 'processing' && (
        <Alert className="border-blue-500 bg-blue-50">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertDescription>
            <strong>Traitement en cours</strong><br />
            Votre paiement est en cours de vérification. 
            Cela peut prendre quelques minutes.
          </AlertDescription>
        </Alert>
      )}

      {status === 'completed' && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Paiement confirmé!</strong><br />
            Votre commande a été créée avec succès et sera traitée dans les plus brefs délais.
          </AlertDescription>
        </Alert>
      )}

      {(status === 'failed' || status === 'cancelled') && (
        <Alert className="border-red-500 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Paiement {status === 'failed' ? 'échoué' : 'annulé'}</strong><br />
            {status === 'failed' 
              ? 'Veuillez vérifier vos informations et réessayer.'
              : 'Vous avez annulé le paiement.'
            } Contactez le support si vous avez besoin d'aide.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default PaymentStatusTracker
