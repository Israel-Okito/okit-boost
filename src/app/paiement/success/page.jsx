
"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  ArrowRight,
  Download,
  Eye,
  RefreshCw
} from "lucide-react"
import { toast } from "sonner"

export default function PaymentSuccessPage() {
  // const searchParams = useSearchParams()
  // const router = useRouter()
  // const [paymentStatus, setPaymentStatus] = useState(null)
  // const [loading, setLoading] = useState(true)
  // const [checking, setChecking] = useState(false)

  // const transactionId = searchParams.get('transaction_id')
  // const token = searchParams.get('token')

  // useEffect(() => {
  //   if (transactionId) {
  //     checkPaymentStatus()
  //   } else {
  //     setLoading(false)
  //   }
  // }, [transactionId])

  // const checkPaymentStatus = async () => {
  //   try {
  //     setChecking(true)
  //     const response = await fetch(`/api/payments/cinetpay?transactionId=${transactionId}`)
  //     const data = await response.json()

  //     if (response.ok) {
  //       setPaymentStatus(data)
  //     } else {
  //       throw new Error(data.error || 'Erreur lors de la vérification')
  //     }
  //   } catch (error) {
  //     console.error('Erreur vérification paiement:', error)
  //     toast.error('Erreur lors de la vérification du paiement')
  //   } finally {
  //     setLoading(false)
  //     setChecking(false)
  //   }
  // }

  // const getStatusIcon = (status) => {
  //   switch (status) {
  //     case 'ACCEPTED':
  //       return <CheckCircle className="w-16 h-16 text-green-500" />
  //     case 'PENDING':
  //       return <Clock className="w-16 h-16 text-yellow-500" />
  //     case 'REFUSED':
  //       return <XCircle className="w-16 h-16 text-red-500" />
  //     case 'CANCELLED':
  //       return <AlertCircle className="w-16 h-16 text-orange-500" />
  //     default:
  //       return <Clock className="w-16 h-16 text-gray-500" />
  //   }
  // }

  // const getStatusColor = (status) => {
  //   switch (status) {
  //     case 'ACCEPTED':
  //       return 'bg-green-100 text-green-800'
  //     case 'PENDING':
  //       return 'bg-yellow-100 text-yellow-800'
  //     case 'REFUSED':
  //       return 'bg-red-100 text-red-800'
  //     case 'CANCELLED':
  //       return 'bg-orange-100 text-orange-800'
  //     default:
  //       return 'bg-gray-100 text-gray-800'
  //   }
  // }

  // const getStatusLabel = (status) => {
  //   switch (status) {
  //     case 'ACCEPTED':
  //       return 'Paiement réussi'
  //     case 'PENDING':
  //       return 'Paiement en cours'
  //     case 'REFUSED':
  //       return 'Paiement refusé'
  //     case 'CANCELLED':
  //       return 'Paiement annulé'
  //     default:
  //       return 'Statut inconnu'
  //   }
  // }

  // const getStatusMessage = (status) => {
  //   switch (status) {
  //     case 'ACCEPTED':
  //       return 'Votre paiement a été traité avec succès. Votre commande est maintenant en cours de traitement.'
  //     case 'PENDING':
  //       return 'Votre paiement est en cours de vérification. Nous vous tiendrons informé de son évolution.'
  //     case 'REFUSED':
  //       return 'Votre paiement a été refusé. Veuillez vérifier vos informations de paiement ou essayer une autre méthode.'
  //     case 'CANCELLED':
  //       return 'Votre paiement a été annulé. Vous pouvez réessayer ou choisir une autre méthode de paiement.'
  //     default:
  //       return 'Nous vérifions le statut de votre paiement...'
  //   }
  // }

  // if (!transactionId) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
  //       <Card className="w-full max-w-md">
  //         <CardHeader className="text-center">
  //           <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
  //           <CardTitle className="text-red-600">Erreur</CardTitle>
  //           <CardDescription>
  //             Aucune information de transaction trouvée.
  //           </CardDescription>
  //         </CardHeader>
  //         <CardContent className="text-center">
  //           <Button onClick={() => router.push('/')} className="w-full">
  //             Retour à l'accueil
  //           </Button>
  //         </CardContent>
  //       </Card>
  //     </div>
  //   )
  // }

  return (

    <div>ff</div>
    // <div className="min-h-screen bg-gray-50 py-12 px-4">
    //   <div className="max-w-4xl mx-auto">
    //     {loading ? (
    //       <Card className="w-full max-w-2xl mx-auto">
    //         <CardHeader className="text-center">
    //           <Skeleton className="w-16 h-16 mx-auto mb-4 rounded-full" />
    //           <Skeleton className="h-6 w-48 mx-auto mb-2" />
    //           <Skeleton className="h-4 w-64 mx-auto" />
    //         </CardHeader>
    //         <CardContent>
    //           <div className="space-y-4">
    //             <Skeleton className="h-4 w-full" />
    //             <Skeleton className="h-4 w-3/4" />
    //             <Skeleton className="h-10 w-full" />
    //           </div>
    //         </CardContent>
    //       </Card>
    //     ) : (
    //       <div className="space-y-8">
    //         {/* Status Principal */}
    //         <Card className="w-full max-w-2xl mx-auto">
    //           <CardHeader className="text-center">
    //             {paymentStatus && getStatusIcon(paymentStatus.status)}
    //             <CardTitle className="text-2xl mt-4">
    //               {paymentStatus ? getStatusLabel(paymentStatus.status) : 'Vérification en cours...'}
    //             </CardTitle>
    //             <CardDescription className="text-lg">
    //               {paymentStatus ? getStatusMessage(paymentStatus.status) : 'Veuillez patienter...'}
    //             </CardDescription>
    //           </CardHeader>
              
    //           {paymentStatus && (
    //             <CardContent className="space-y-6">
    //               {/* Informations de transaction */}
    //               <div className="bg-gray-50 rounded-lg p-4 space-y-3">
    //                 <div className="flex justify-between items-center">
    //                   <span className="font-medium">Statut:</span>
    //                   <Badge className={getStatusColor(paymentStatus.status)}>
    //                     {getStatusLabel(paymentStatus.status)}
    //                   </Badge>
    //                 </div>
                    
    //                 <div className="flex justify-between items-center">
    //                   <span className="font-medium">Transaction ID:</span>
    //                   <span className="text-sm font-mono bg-white px-2 py-1 rounded">
    //                     {paymentStatus.transactionId}
    //                   </span>
    //                 </div>
                    
    //                 <div className="flex justify-between items-center">
    //                   <span className="font-medium">Montant:</span>
    //                   <span className="font-semibold">
    //                     {paymentStatus.amount} {paymentStatus.currency}
    //                   </span>
    //                 </div>
                    
    //                 {paymentStatus.paymentMethod && (
    //                   <div className="flex justify-between items-center">
    //                     <span className="font-medium">Méthode:</span>
    //                     <span className="capitalize">{paymentStatus.paymentMethod}</span>
    //                   </div>
    //                 )}
                    
    //                 {paymentStatus.order && (
    //                   <div className="flex justify-between items-center">
    //                     <span className="font-medium">Commande:</span>
    //                     <span>{paymentStatus.order.orderNumber}</span>
    //                   </div>
    //                 )}
    //               </div>

    //               {/* Actions selon le statut */}
    //               <div className="space-y-3">
    //                 {paymentStatus.status === 'ACCEPTED' && (
    //                   <>
    //                     <Button 
    //                       onClick={() => router.push('/mon-compte')}
    //                       className="w-full"
    //                     >
    //                       <Eye className="w-4 h-4 mr-2" />
    //                       Voir mes commandes
    //                     </Button>
                        
    //                     {/* <Button 
    //                       variant="outline"
    //                       className="w-full"
    //                     >
    //                       <Download className="w-4 h-4 mr-2" />
    //                       Télécharger le reçu
    //                     </Button> */}
    //                   </>
    //                 )}
                    
    //                 {paymentStatus.status === 'PENDING' && (
    //                   <Button 
    //                     onClick={checkPaymentStatus}
    //                     disabled={checking}
    //                     variant="outline"
    //                     className="w-full"
    //                   >
    //                     {checking ? (
    //                       <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
    //                     ) : (
    //                       <RefreshCw className="w-4 h-4 mr-2" />
    //                     )}
    //                     Actualiser le statut
    //                   </Button>
    //                 )}
                    
    //                 {['REFUSED', 'CANCELLED'].includes(paymentStatus.status) && (
    //                   <Button 
    //                     onClick={() => router.push('/caisse')}
    //                     className="w-full"
    //                   >
    //                     <ArrowRight className="w-4 h-4 mr-2" />
    //                     Réessayer le paiement
    //                   </Button>
    //                 )}
    //               </div>
    //             </CardContent>
    //           )}
    //         </Card>

    //         {/* Informations supplémentaires */}
    //         {paymentStatus?.status === 'ACCEPTED' && (
    //           <Card className="max-w-2xl mx-auto">
    //             <CardHeader>
    //               <CardTitle>Prochaines étapes</CardTitle>
    //             </CardHeader>
    //             <CardContent>
    //               <div className="space-y-4">
    //                 <div className="flex items-start space-x-3">
    //                   <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
    //                     <span className="text-xs font-bold text-blue-600">1</span>
    //                   </div>
    //                   <div>
    //                     <h4 className="font-semibold">Traitement de votre commande</h4>
    //                     <p className="text-sm text-gray-600">
    //                       Notre équipe va maintenant traiter votre commande. Vous recevrez une confirmation par email.
    //                     </p>
    //                   </div>
    //                 </div>
                    
    //                 <div className="flex items-start space-x-3">
    //                   <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
    //                     <span className="text-xs font-bold text-blue-600">2</span>
    //                   </div>
    //                   <div>
    //                     <h4 className="font-semibold">Livraison des services</h4>
    //                     <p className="text-sm text-gray-600">
    //                       Les services seront livrés selon les délais indiqués lors de votre commande.
    //                     </p>
    //                   </div>
    //                 </div>
                    
    //                 <div className="flex items-start space-x-3">
    //                   <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
    //                     <span className="text-xs font-bold text-blue-600">3</span>
    //                   </div>
    //                   <div>
    //                     <h4 className="font-semibold">Suivi en temps réel</h4>
    //                     <p className="text-sm text-gray-600">
    //                       Suivez l'évolution de votre commande depuis votre espace client.
    //                     </p>
    //                   </div>
    //                 </div>
    //               </div>
    //             </CardContent>
    //           </Card>
    //         )}

    //         {/* Support */}
    //         <Card className="max-w-2xl mx-auto">
    //           <CardHeader>
    //             <CardTitle>Besoin d'aide ?</CardTitle>
    //           </CardHeader>
    //           <CardContent>
    //             <div className="text-center space-y-4">
    //               <p className="text-gray-600">
    //                 Si vous avez des questions concernant votre paiement ou votre commande, 
    //                 n'hésitez pas à nous contacter.
    //               </p>
                  
    //               <div className="flex flex-col sm:flex-row gap-3 justify-center">
    //                 <Button variant="outline" asChild>
    //                   <a href="mailto:support@okit-boost.com">
    //                     Contacter le support
    //                   </a>
    //                 </Button>
                    
    //                 <Button variant="outline" onClick={() => router.push('/')}>
    //                   Retour à l'accueil
    //                 </Button>
    //               </div>
                  
    //               <p className="text-xs text-gray-500">
    //                 Référence de transaction: {transactionId}
    //               </p>
    //             </div>
    //           </CardContent>
    //         </Card>
    //       </div>
    //     )}
    //   </div>
    // </div>
  )
}