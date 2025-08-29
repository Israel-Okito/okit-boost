// src/app/paiement/success/page.jsx
"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  ArrowRight,
  Download,
  Eye,
  RefreshCw,
  Home,
  ShoppingBag,
  Phone,
  Mail
} from "lucide-react"
import { toast } from "sonner"

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [paymentStatus, setPaymentStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const transactionId = searchParams.get('transaction_id')
  const token = searchParams.get('token')

  useEffect(() => {
    if (transactionId) {
      checkPaymentStatus()
      
      // Vérification périodique pour les paiements en attente
      const interval = setInterval(() => {
        if (paymentStatus?.status === 'PENDING' || paymentStatus?.status === 'pending') {
          checkPaymentStatus(true)
        }
      }, 10000) // Vérifier toutes les 10 secondes

      return () => clearInterval(interval)
    } else {
      setLoading(false)
    }
  }, [transactionId])

  const checkPaymentStatus = async (isAutoCheck = false) => {
    try {
      if (!isAutoCheck) {
        setChecking(true)
      }

      const response = await fetch(`/api/payments/cinetpay/status?transactionId=${transactionId}`)
      const data = await response.json()

      if (response.ok && data.success) {
        // Adapter la structure de réponse de notre nouvelle API avec gestion des valeurs nulles
        const adaptedData = {
          transactionId: data.transaction?.transaction_id || transactionId,
          status: (data.transaction?.status || 'PENDING').toUpperCase(),
          amount: data.transaction?.amount || 0,
          currency: data.transaction?.currency || 'CDF',
          paymentMethod: data.transaction?.payment_method || 'mobile_money',
          paymentDate: data.transaction?.completed_at || data.transaction?.created_at,
          customerPhone: data.transaction?.customer_phone || '',
          order: data.order ? {
            orderNumber: data.order.order_number || 'N/A',
            status: data.order.status || 'pending',
            total: { 
              cdf: data.order.total_cdf || 0, 
              usd: data.order.total_usd || 0 
            }
          } : null,
          lastChecked: new Date().toISOString()
        }
        
        setPaymentStatus(adaptedData)
        setRetryCount(0)

        // Afficher un toast seulement si le statut a changé
        if (!isAutoCheck && adaptedData.status === 'ACCEPTED') {
          toast.success('Paiement confirmé !')
        }
      } else if (!response.ok && response.status === 404) {
        // Transaction non trouvée - créer un statut par défaut
        const fallbackData = {
          transactionId: transactionId,
          status: 'PENDING',
          amount: 0,
          currency: 'CDF',
          paymentMethod: 'mobile_money',
          paymentDate: null,
          customerPhone: '',
          order: null,
          lastChecked: new Date().toISOString(),
          error: 'Transaction non trouvée en base de données'
        }
        
        setPaymentStatus(fallbackData)
        
        if (!isAutoCheck) {
          toast.error('Transaction non trouvée. Le paiement est peut-être encore en cours de traitement.')
        }
      } else {
        throw new Error(data.error || `Erreur serveur: ${response.status}`)
      }
    } catch (error) {
      console.error('Erreur vérification paiement:', error)
      setRetryCount(prev => prev + 1)
      
      // Si on ne peut pas vérifier, créer un statut d'erreur
      setPaymentStatus({
        transactionId: transactionId,
        status: 'UNKNOWN',
        amount: 0,
        currency: 'CDF',
        paymentMethod: 'mobile_money',
        paymentDate: null,
        customerPhone: '',
        order: null,
        lastChecked: new Date().toISOString(),
        error: error.message
      })
      
      if (!isAutoCheck) {
        toast.error('Impossible de vérifier le paiement. Réessayez dans quelques instants.')
      }
    } finally {
      setLoading(false)
      setChecking(false)
    }
  }

  const getStatusConfig = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return {
          icon: <CheckCircle className="w-16 h-16 text-green-500" />,
          title: 'Paiement réussi !',
          description: 'Votre paiement a été traité avec succès. Votre commande est maintenant en cours de traitement.',
          badgeClass: 'bg-green-100 text-green-800',
          alertType: 'success'
        }
      case 'PENDING':
        return {
          icon: <Clock className="w-16 h-16 text-yellow-500" />,
          title: 'Paiement en cours...',
          description: 'Votre paiement est en cours de vérification. Nous vous tiendrons informé de son évolution.',
          badgeClass: 'bg-yellow-100 text-yellow-800',
          alertType: 'warning'
        }
      case 'REFUSED':
        return {
          icon: <XCircle className="w-16 h-16 text-red-500" />,
          title: 'Paiement refusé',
          description: 'Votre paiement a été refusé. Veuillez vérifier vos informations ou essayer une autre méthode.',
          badgeClass: 'bg-red-100 text-red-800',
          alertType: 'error'
        }
      case 'CANCELLED':
        return {
          icon: <AlertCircle className="w-16 h-16 text-orange-500" />,
          title: 'Paiement annulé',
          description: 'Votre paiement a été annulé. Vous pouvez réessayer ou choisir une autre méthode.',
          badgeClass: 'bg-orange-100 text-orange-800',
          alertType: 'warning'
        }
      case 'UNKNOWN':
        return {
          icon: <AlertCircle className="w-16 h-16 text-gray-500" />,
          title: 'Statut indéterminé',
          description: 'Nous ne parvenons pas à vérifier le statut de votre paiement. Contactez le support si le problème persiste.',
          badgeClass: 'bg-gray-100 text-gray-800',
          alertType: 'warning'
        }
      default:
        return {
          icon: <Clock className="w-16 h-16 text-gray-500" />,
          title: 'Vérification en cours...',
          description: 'Nous vérifions le statut de votre paiement...',
          badgeClass: 'bg-gray-100 text-gray-800',
          alertType: 'info'
        }
    }
  }

  if (!transactionId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <CardTitle className="text-red-600">Information manquante</CardTitle>
            <CardDescription>
              Aucune information de transaction trouvée.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Il semble que vous ayez accédé à cette page directement. 
                Veuillez passer par le processus de commande normal.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Button onClick={() => router.push('/')} className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Retour à l'accueil
              </Button>
              <Button onClick={() => router.push('/services')} variant="outline" className="w-full">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Voir les services
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <Skeleton className="w-16 h-16 mx-auto mb-4 rounded-full" />
              <Skeleton className="h-6 w-48 mx-auto mb-2" />
              <Skeleton className="h-4 w-64 mx-auto" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const statusConfig = getStatusConfig(paymentStatus?.status)

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Status Principal */}
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader className="text-center">
            {statusConfig.icon}
            <CardTitle className="text-2xl mt-4">
              {statusConfig.title}
            </CardTitle>
            <CardDescription className="text-lg">
              {statusConfig.description}
            </CardDescription>
          </CardHeader>
          
          {paymentStatus && (
            <CardContent className="space-y-6">
              {/* Badge de statut */}
              <div className="flex justify-center">
                <Badge className={statusConfig.badgeClass}>
                  {statusConfig.title}
                </Badge>
              </div>

              {/* Erreur spécifique si présente */}
              {paymentStatus.error && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>Détail:</strong> {paymentStatus.error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Informations de transaction */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Transaction ID:</span>
                    <p className="font-mono text-xs mt-1 break-all">{paymentStatus.transactionId}</p>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-600">Montant:</span>
                    <p className="font-semibold text-lg mt-1">
                      {paymentStatus.amount} {paymentStatus.currency}
                    </p>
                  </div>
                  
                  {paymentStatus.paymentMethod && (
                    <div>
                      <span className="font-medium text-gray-600">Méthode:</span>
                      <p className="capitalize mt-1">{paymentStatus.paymentMethod}</p>
                    </div>
                  )}
                  
                  {paymentStatus.order && (
                    <div>
                      <span className="font-medium text-gray-600">Commande:</span>
                      <p className="mt-1">{paymentStatus.order.orderNumber}</p>
                    </div>
                  )}
                </div>

                {paymentStatus.customerPhone && (
                  <div>
                    <span className="font-medium text-gray-600">Téléphone utilisé:</span>
                    <p className="mt-1">{paymentStatus.customerPhone}</p>
                  </div>
                )}

                {paymentStatus.paymentDate && (
                  <div>
                    <span className="font-medium text-gray-600">Date de paiement:</span>
                    <p className="mt-1">
                      {new Date(paymentStatus.paymentDate).toLocaleString('fr-FR')}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions selon le statut */}
              <div className="space-y-3">
                {paymentStatus.status === 'ACCEPTED' && (
                  <>
                    <Button 
                      onClick={() => router.push('/mon-compte/commandes')}
                      className="w-full"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Voir mes commandes
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => window.print()}
                      className="w-full"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Imprimer le reçu
                    </Button>
                  </>
                )}
                
                {paymentStatus.status === 'PENDING' && (
                  <>
                    <Button 
                      onClick={() => checkPaymentStatus()}
                      disabled={checking}
                      variant="outline"
                      className="w-full"
                    >
                      {checking ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      Vérifier le statut
                    </Button>
                    
                    <Alert>
                      <Clock className="h-4 w-4" />
                      <AlertDescription>
                        Le paiement peut prendre quelques minutes à être confirmé. 
                        Cette page se met à jour automatiquement.
                      </AlertDescription>
                    </Alert>
                  </>
                )}
                
                {['REFUSED', 'CANCELLED'].includes(paymentStatus.status) && (
                  <>
                    <Button 
                      onClick={() => router.push('/caisse')}
                      className="w-full"
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Réessayer le paiement
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => router.push('/contact')}
                      className="w-full"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Contacter le support
                    </Button>
                  </>
                )}
              </div>

              {/* Informations de dernière vérification */}
              <div className="text-xs text-center text-gray-500">
                Dernière vérification: {new Date(paymentStatus.lastChecked).toLocaleTimeString('fr-FR')}
                {retryCount > 0 && ` (${retryCount} tentatives)`}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Prochaines étapes pour paiement accepté */}
        {paymentStatus?.status === 'ACCEPTED' && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                Prochaines étapes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Traitement de votre commande</h4>
                    <p className="text-sm text-gray-600">
                      Notre équipe va maintenant traiter votre commande. Vous recevrez une confirmation par email.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Livraison des services</h4>
                    <p className="text-sm text-gray-600">
                      Les services seront livrés selon les délais indiqués lors de votre commande.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Suivi en temps réel</h4>
                    <p className="text-sm text-gray-600">
                      Suivez l'évolution de votre commande depuis votre espace client.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Support et contact */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Besoin d'aide ?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-gray-600">
                Si vous avez des questions concernant votre paiement ou votre commande, 
                n'hésitez pas à nous contacter.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="outline" asChild>
                  <a href="mailto:okitdevservice@gmail.com">
                    <Mail className="w-4 h-4 mr-2" />
                    Email support
                  </a>
                </Button>
                
                <Button variant="outline" asChild>
                  <a href="tel:+243123456789">
                    <Phone className="w-4 h-4 mr-2" />
                    Appeler
                  </a>
                </Button>
                
                <Button variant="outline" onClick={() => router.push('/')}>
                  <Home className="w-4 h-4 mr-2" />
                  Accueil
                </Button>
              </div>
              
              {transactionId && (
                <p className="text-xs text-gray-500 mt-4">
                  Référence de transaction: {transactionId}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <Skeleton className="w-16 h-16 mx-auto mb-4 rounded-full" />
              <Skeleton className="h-6 w-48 mx-auto mb-2" />
              <Skeleton className="h-4 w-64 mx-auto" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}