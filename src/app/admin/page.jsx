"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Package, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  RefreshCw
} from "lucide-react"
import { toast } from "sonner"
import { updateOrderStatus } from "@/lib/actions/admin"

// Composants de Skeleton
function StatsCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-24" />
      </CardContent>
    </Card>
  )
}

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <Skeleton className="h-4 w-32 mb-1" />
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div>
          <Skeleton className="h-4 w-20 mb-1" />
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="text-right">
          <Skeleton className="h-5 w-24 mb-1" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-24" />
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  )
}

export default function AdminPanel() {
  const [stats, setStats] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [updating, setUpdating] = useState(null) // ID de la commande en cours de mise à jour

  // Charger les statistiques
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        cache: 'no-store'
      })
      const data = await response.json()
      
      if (response.ok) {
        setStats(data)
      } else {
        if (response.status === 403) {
          window.location.href = '/'
          return
        }
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      toast.error('Erreur lors du chargement des statistiques')
    } finally {
      setLoading(false)
    }
  }, [])

  console.log(stats)

  // Charger les commandes
  const fetchOrders = useCallback(async () => {
    try {
      setOrdersLoading(true)
      const url = statusFilter === 'all' 
        ? '/api/admin/orders' 
        : `/api/admin/orders?status=${statusFilter}`
      
      const response = await fetch(url, {
        cache: 'no-store'
      })
      const data = await response.json()
      
      if (response.ok) {
        setOrders(data.orders)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Erreur lors du chargement des commandes')
    } finally {
      setOrdersLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleUpdateOrderStatus = async (orderId, newStatus, adminNotes = '') => {
    try {
      setUpdating(orderId)
      
      // Utiliser server action au lieu d'un appel API
      await updateOrderStatus(orderId, newStatus, adminNotes)
      
      toast.success('Statut mis à jour avec succès')
      
      // Actualiser les données
      await Promise.all([fetchOrders(), fetchStats()])
      setSelectedOrder(null)
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setUpdating(null)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'refunded': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'processing': return <RefreshCw className="w-4 h-4" />
      case 'pending': return <AlertCircle className="w-4 h-4" />
      case 'cancelled': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return 'Terminé'
      case 'processing': return 'En cours'
      case 'pending': return 'En attente'
      case 'cancelled': return 'Annulé'
      case 'refunded': return 'Remboursé'
      default: return 'Inconnu'
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Panel Administrateur</h1>
        <p className="text-gray-600">Gérez vos commandes et surveillez votre activité</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {loading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : stats ? (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Commandes totales</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  +{stats.pendingOrders} en attente
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Clients enregistrés
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenus (CDF)</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalRevenueCDF.toLocaleString()} CDF
                </div>
                <p className="text-xs text-muted-foreground">
                  Commandes terminées
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Essais gratuits</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.trialRequests}</div>
                <p className="text-xs text-muted-foreground">
                  Demandes en attente
                </p>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      <Tabs defaultValue="orders" className="space-y-6">
        <TabsList>
          <TabsTrigger value="orders">Commandes</TabsTrigger>
          <TabsTrigger value="recent">Activité récente</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-6">
          {/* Filtres */}
          <Card>
            <CardHeader>
              <CardTitle>Filtrer les commandes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les commandes</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="processing">En cours</SelectItem>
                    <SelectItem value="completed">Terminées</SelectItem>
                    <SelectItem value="cancelled">Annulées</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={fetchOrders} variant="outline" disabled={ordersLoading}>
                  {ordersLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                  Actualiser
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Liste des commandes */}
          <Card>
            <CardHeader>
              <CardTitle>Commandes ({orders.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <OrderCardSkeleton key={i} />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aucune commande trouvée
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="font-medium">{order.order_number}</span>
                          <Badge className={getStatusColor(order.status)}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(order.status)}
                              <span>{getStatusLabel(order.status)}</span>
                            </div>
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.profiles?.full_name || order.customer_name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {order.profiles?.email || order.customer_email}
                          </div>
                          <div className="text-sm text-gray-600">
                            {order.customer_phone}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm text-gray-600">
                            {order.order_items?.length || 0} service(s)
                          </div>
                          <div className="text-sm text-gray-600">
                            Paiement: {order.payment_method}
                          </div>
                          {order.payment_proof_url && (
                            <a 
                              href={order.payment_proof_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              Voir la preuve
                            </a>
                          )}
                        </div>

                        <div className="text-right">
                          <div className="text-lg font-semibold">
                            {order.total_cdf.toLocaleString()} CDF
                          </div>
                          <div className="text-sm text-gray-600">
                            ${order.total_usd.toFixed(2)} USD
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Voir détails
                        </Button>

                        <div className="flex space-x-2">
                          {order.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleUpdateOrderStatus(order.id, 'processing')}
                                disabled={updating === order.id}
                              >
                                {updating === order.id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                ) : null}
                                Accepter
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                                disabled={updating === order.id}
                              >
                                {updating === order.id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                ) : null}
                                Refuser
                              </Button>
                            </>
                          )}
                          {order.status === 'processing' && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                              disabled={updating === order.id}
                            >
                              {updating === order.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                              ) : null}
                              Marquer terminé
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Activité récente</CardTitle>
              <CardDescription>Les 5 dernières commandes</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <Skeleton className="h-4 w-20 mb-2" />
                        <Skeleton className="h-3 w-32 mb-1" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <div className="text-right">
                        <Skeleton className="h-5 w-16 mb-1" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : stats?.recentOrders ? (
                <div className="space-y-4">
                  {stats.recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{order.order_number}</div>
                        <div className="text-sm text-gray-600">
                          {order.profiles?.full_name || 'Client anonyme'} - {order.profiles?.email}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleString('fr-FR')}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusLabel(order.status)}
                        </Badge>
                        <div className="text-sm font-medium mt-1">
                          {order.currency === 'CDF' 
                            ? `${order.total_cdf.toLocaleString()} CDF`
                            : `${order.total_usd.toFixed(2)} USD`
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal détails commande - Reste identique */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
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
                        {getStatusLabel(selectedOrder.status)}
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
                  </CardContent>
                </Card>

                {/* Informations client */}
                <Card>
                  <CardHeader>
                    <CardTitle>Client</CardTitle>
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
                    <div>
                      <span className="font-medium">Paiement: </span>
                      {selectedOrder.payment_method}
                    </div>
                    {selectedOrder.payment_proof_url && (
                      <div>
                        <span className="font-medium">Preuve: </span>
                        <a 
                          href={selectedOrder.payment_proof_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Voir la preuve de paiement
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Services commandés */}
              <Card className="mb-6">
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
                        <div className="text-sm text-gray-600 truncate">
                          Lien: {item.target_link}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Actions admin */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions administrateur</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Changer le statut
                      </label>
                      <Select
                        value={selectedOrder.status}
                        onValueChange={(newStatus) => {
                          if (newStatus !== selectedOrder.status) {
                            handleUpdateOrderStatus(selectedOrder.id, newStatus)
                          }
                        }}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="processing">En cours</SelectItem>
                          <SelectItem value="completed">Terminé</SelectItem>
                          <SelectItem value="cancelled">Annulé</SelectItem>
                          <SelectItem value="refunded">Remboursé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Notes administrateur
                      </label>
                      <Textarea
                        placeholder="Ajouter des notes internes..."
                        defaultValue={selectedOrder.admin_notes || ''}
                        rows={3}
                        onBlur={(e) => {
                          if (e.target.value !== selectedOrder.admin_notes) {
                            handleUpdateOrderStatus(
                              selectedOrder.id, 
                              selectedOrder.status, 
                              e.target.value
                            )
                          }
                        }}
                      />
                    </div>

                    {selectedOrder.notes && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Notes du client
                        </label>
                        <div className="p-3 bg-gray-50 rounded-md text-sm">
                          {selectedOrder.notes}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}