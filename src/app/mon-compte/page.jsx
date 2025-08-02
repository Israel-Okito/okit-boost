"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  User, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Eye,
  Download,
  Edit,
  Save
} from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/hooks/useAuth"
import { updateProfile } from "@/lib/actions/auth"

// Composants Skeleton
function OrderCardSkeleton() {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Skeleton className="h-4 w-32 mb-1" />
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div>
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
      <div className="mt-4 flex space-x-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  )
}

function StatsCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16" />
      </CardContent>
    </Card>
  )
}

export default function AccountPage() {
  const { user, profile, refreshProfile } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileData, setProfileData] = useState({
    full_name: '',
    phone: ''
  })
  const [selectedOrder, setSelectedOrder] = useState(null)

  // Charger les commandes de l'utilisateur
  const fetchOrders = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const response = await fetch('/api/orders', {
        cache: 'no-store'
      })
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des commandes')
      }

      const data = await response.json()
      setOrders(data.orders || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Erreur lors du chargement des commandes')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchOrders()
    }
  }, [fetchOrders])

  useEffect(() => {
    if (profile) {
      setProfileData({
        full_name: profile.full_name || '',
        phone: profile.phone || ''
      })
    }
  }, [profile])

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setProfileLoading(true)

    try {
      const formData = new FormData()
      formData.append('full_name', profileData.full_name)
      formData.append('phone', profileData.phone)

      await updateProfile(formData)
      await refreshProfile()
      
      setEditingProfile(false)
      toast.success('Profil mis à jour avec succès')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Erreur lors de la mise à jour du profil')
    } finally {
      setProfileLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "processing":
        return <RefreshCw className="w-4 h-4 text-blue-600" />
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case "completed":
        return "Terminé"
      case "processing":
        return "En cours"
      case "pending":
        return "En attente"
      case "cancelled":
        return "Annulé"
      case "refunded":
        return "Remboursé"
      default:
        return "Inconnu"
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "refunded":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Calculer les statistiques
  const stats = {
    totalOrders: orders.length,
    totalSpent: orders.reduce((sum, order) => sum + order.total_cdf, 0),
    completedOrders: orders.filter(order => order.status === 'completed').length,
    pendingOrders: orders.filter(order => order.status === 'pending').length
  }

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Accès non autorisé</h1>
          <p className="text-gray-600">Veuillez vous connecter pour accéder à votre compte.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mon Compte</h1>
        <p className="text-gray-600">Gérez vos commandes et votre profil</p>
      </div>

      <Tabs defaultValue="orders" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="orders">Mes Commandes</TabsTrigger>
          <TabsTrigger value="profile">Mon Profil</TabsTrigger>
          <TabsTrigger value="stats">Statistiques</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Historique des commandes
              </CardTitle>
              <CardDescription>Consultez le statut de vos commandes</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <OrderCardSkeleton key={i} />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune commande</h3>
                  <p className="text-gray-600 mb-4">Vous n'avez pas encore passé de commande.</p>
                  <Button asChild>
                    <a href="/services">Découvrir nos services</a>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="text-sm font-medium text-gray-900">{order.order_number}</div>
                          <Badge className={getStatusColor(order.status)}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(order.status)}
                              <span>{getStatusLabel(order.status)}</span>
                            </div>
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString("fr-FR")}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-600 mb-1">
                            {order.order_items?.length || 0} service(s)
                          </div>
                          {order.order_items?.slice(0, 2).map((item, index) => (
                            <div key={index} className="text-sm text-gray-800">
                              • {item.service_name} ({item.quantity.toLocaleString()})
                            </div>
                          ))}
                          {order.order_items?.length > 2 && (
                            <div className="text-sm text-gray-600">
                              + {order.order_items.length - 2} autres services
                            </div>
                          )}
                        </div>
                        <div className="text-right md:text-left">
                          <div className="text-lg font-semibold text-gray-900">
                            {order.total_cdf.toLocaleString()} CDF
                          </div>
                          <div className="text-sm text-gray-600">
                            ${order.total_usd.toFixed(2)} USD
                          </div>
                          <div className="text-sm text-gray-600">
                            Paiement: {order.payment_method}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Voir détails
                        </Button>
                        {/* {order.status === "completed" && (
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Facture
                          </Button>
                        )} */}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Informations personnelles
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingProfile(!editingProfile)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {editingProfile ? 'Annuler' : 'Modifier'}
                </Button>
              </CardTitle>
              <CardDescription>Modifiez vos informations de compte</CardDescription>
            </CardHeader>
            <CardContent>
              {editingProfile ? (
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name">Nom complet</Label>
                      <Input
                        id="full_name"
                        type="text"
                        value={profileData.full_name}
                        onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={user.email}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      placeholder="+243 XXX XXX XXX"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button type="submit" disabled={profileLoading}>
                      {profileLoading ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Sauvegarder
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setEditingProfile(false)}
                    >
                      Annuler
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nom complet</Label>
                      <div className="p-3 bg-gray-50 rounded-md">
                        {profile?.full_name || 'Non défini'}
                      </div>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <div className="p-3 bg-gray-50 rounded-md">
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label>Téléphone</Label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      {profile?.phone || 'Non défini'}
                    </div>
                  </div>
                  <div>
                    <Label>Membre depuis</Label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      {new Date(user.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              <>
                <StatsCardSkeleton />
                <StatsCardSkeleton />
                <StatsCardSkeleton />
                <StatsCardSkeleton />
              </>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Commandes totales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">{stats.totalOrders}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Montant total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {stats.totalSpent.toLocaleString()} CDF
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Commandes terminées</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">
                      {stats.completedOrders}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">En attente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-yellow-600">
                      {stats.pendingOrders}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Graphique des commandes récentes */}
          <Card>
            <CardHeader>
              <CardTitle>Activité récente</CardTitle>
              <CardDescription>Vos dernières commandes</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
                </div>
              ) : orders.slice(0, 5).length > 0 ? (
                <div className="space-y-3">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{order.order_number}</div>
                        <div className="text-xs text-gray-600">
                          {new Date(order.created_at).toLocaleDateString('fr-FR')} - {order.order_items?.length || 0} service(s)
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(order.status)} size="sm">
                          {getStatusLabel(order.status)}
                        </Badge>
                        <div className="text-sm font-medium mt-1">
                          {order.total_cdf.toLocaleString()} CDF
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Aucune activité récente
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal détails commande */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Détails de la commande</h2>
                <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                  Fermer
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Informations commande */}
                <Card>
                  <CardHeader>
                    <CardTitle>Informations générales</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="font-medium">Numéro: </span>
                      {selectedOrder.order_number}
                    </div>
                    <div>
                      <span className="font-medium">Statut: </span>
                      <Badge className={getStatusColor(selectedOrder.status)}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(selectedOrder.status)}
                          <span>{getStatusLabel(selectedOrder.status)}</span>
                        </div>
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Total: </span>
                      {selectedOrder.total_cdf.toLocaleString()} CDF 
                      (${selectedOrder.total_usd.toFixed(2)} USD)
                    </div>
                    <div>
                      <span className="font-medium">Date: </span>
                      {new Date(selectedOrder.created_at).toLocaleString('fr-FR')}
                    </div>
                    <div>
                      <span className="font-medium">Paiement: </span>
                      {selectedOrder.payment_method}
                    </div>
                  </CardContent>
                </Card>

                {/* Informations client */}
                <Card>
                  <CardHeader>
                    <CardTitle>Informations de livraison</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="font-medium">Nom: </span>
                      {selectedOrder.customer_name}
                    </div>
                    <div>
                      <span className="font-medium">Email: </span>
                      {selectedOrder.customer_email}
                    </div>
                    <div>
                      <span className="font-medium">Téléphone: </span>
                      {selectedOrder.customer_phone}
                    </div>
                    {selectedOrder.notes && (
                      <div>
                        <span className="font-medium">Notes: </span>
                        <div className="mt-1 p-2 bg-gray-50 rounded text-sm">
                          {selectedOrder.notes}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Services commandés */}
              <Card>
                <CardHeader>
                  <CardTitle>Services commandés</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedOrder.order_items?.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">{item.service_name}</h4>
                            <p className="text-sm text-gray-600 capitalize">
                              {item.platform_name}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              {item.total_cdf.toLocaleString()} CDF
                            </div>
                            <div className="text-sm text-gray-600">
                              ${item.total_usd.toFixed(2)} USD
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          Quantité: {item.quantity.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Lien cible: </span>
                          <a 
                            href={item.target_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline break-all"
                          >
                            {item.target_link}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="mt-6 flex justify-between">
                <div>
                  {selectedOrder.payment_proof_url && (
                    <Button variant="outline" asChild>
                      <a href={selectedOrder.payment_proof_url} target="_blank" rel="noopener noreferrer">
                        <Eye className="w-4 h-4 mr-2" />
                        Voir preuve de paiement
                      </a>
                    </Button>
                  )}
                </div>
                <div className="space-x-2">
                  <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                    Fermer
                  </Button>
                  {/* {selectedOrder.status === "completed" && (
                    <Button>
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger facture
                    </Button>
                  )} */}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}