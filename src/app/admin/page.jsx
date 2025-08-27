"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/hooks/useAuth"
import { useRouter } from "next/navigation"
import Dashboard from "@/components/admin/Dashboard"
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
  RefreshCw,
  Trash2,
  Shield,
  Settings
} from "lucide-react"
import { toast } from "sonner"
import { updateOrderStatus, updateTrialRequestStatus, deleteOrder, deleteTrialRequest } from "@/lib/actions/admin"

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
  const { user, profile } = useAuth()
  const router = useRouter()
  const [currentView, setCurrentView] = useState('dashboard')

  // Vérification des droits d'admin
  useEffect(() => {
    if (!user) {
      router.push('/connexion')
      return
    }
    
    // Vérifier si l'utilisateur est admin (vous pouvez adapter cette logique)
    if (!profile?.admin && user?.email !== 'israelokito88@gmail.com') {
      toast.error('Accès non autorisé')
      router.push('/')
      return
    }
  }, [user, profile, router])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Vérification des autorisations...</p>
        </div>
      </div>
    )
  }

  if (!profile?.admin && user?.email !== 'israelokito88@gmail.com') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès Refusé</h2>
          <p className="text-gray-600 mb-4">Vous n'avez pas les droits d'accès à cette page.</p>
          <Button onClick={() => router.push('/')}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Admin */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Administration</h1>
                <p className="text-sm text-gray-600 hidden sm:block">Okit-Boost Panel</p>
              </div>
            </div>
            
            {/* Navigation Tabs - Responsive */}
            <div className="hidden md:flex items-center space-x-4">
              <Button
                variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('dashboard')}
                className="flex items-center space-x-2"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Dashboard</span>
              </Button>
              <Button
                variant={currentView === 'orders' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('orders')}
                className="flex items-center space-x-2"
              >
                <Package className="w-4 h-4" />
                <span>Commandes</span>
              </Button>
              <Button
                variant={currentView === 'settings' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('settings')}
                className="flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>Paramètres</span>
              </Button>
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Select value={currentView} onValueChange={setCurrentView}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dashboard">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4" />
                      <span>Dashboard</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="orders">
                    <div className="flex items-center space-x-2">
                      <Package className="w-4 h-4" />
                      <span>Commandes</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="settings">
                    <div className="flex items-center space-x-2">
                      <Settings className="w-4 h-4" />
                      <span>Paramètres</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'orders' && <LegacyOrdersView />}
        {currentView === 'settings' && <AdminSettings />}
      </div>
    </div>
  )
}

// Composant pour les paramètres admin
function AdminSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Paramètres du système</CardTitle>
          <CardDescription>Configuration de la plateforme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Mode maintenance</h4>
                <p className="text-sm text-gray-600">Activer/désactiver la maintenance</p>
              </div>
              <Button variant="outline" size="sm">
                Configurer
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Notifications</h4>
                <p className="text-sm text-gray-600">Gérer les notifications système</p>
              </div>
              <Button variant="outline" size="sm">
                Configurer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Vue legacy des commandes (conserver la logique existante)
function LegacyOrdersView() {
  const [stats, setStats] = useState(null)
  const [orders, setOrders] = useState([])
  const [trials, setTrials] = useState([])
  const [loading, setLoading] = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [trialsLoading, setTrialsLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [selectedTrial, setSelectedTrial] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [updating, setUpdating] = useState(null)
  const [updatingtrial, setUpdatingtrial] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [duplicateEmails, setDuplicateEmails] = useState([])

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

  // Charger les demandes d'essai
  const fetchTrials = useCallback(async () => {
    try {
      setTrialsLoading(true)

      const url = statusFilter === 'all' 
      ? '/api/admin/trial-requets' 
      : `/api/admin/trial-requets?status=${statusFilter}`
      
      const response = await fetch(url, {
        cache: 'no-store'
      })
      const data = await response.json()
      
      if (response.ok) {
        setTrials(data.trials)
        // Identifier les emails dupliqués
        const emailCounts = {}
        data.trials.forEach(trial => {
          emailCounts[trial.email] = (emailCounts[trial.email] || 0) + 1
        })
        const duplicates = Object.keys(emailCounts).filter(email => emailCounts[email] > 1)
        setDuplicateEmails(duplicates)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Error fetching demandes d'essaie :", error)
      toast.error("Erreur lors du chargement des demandes d'essaie ")
    } finally {
      setTrialsLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  useEffect(() => {
    fetchTrials()
  }, [fetchTrials])

  const handleUpdateOrderStatus = async (orderId, newStatus, adminNotes = '') => {
    try {
      setUpdating(orderId)
      
      await updateOrderStatus(orderId, newStatus, adminNotes)
      
      toast.success('Statut mis à jour avec succès')
      
      await Promise.all([fetchOrders(), fetchStats()])
      setSelectedOrder(null)
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setUpdating(null)
    }
  }

  const handleUpdateTrialStatus = async (requestId, newStatus, adminNotes = '') => {
    try {
      setUpdatingtrial(requestId)
      
      await updateTrialRequestStatus(requestId, newStatus, adminNotes)
      
      toast.success('Statut mis à jour avec succès')
      
      await Promise.all([fetchTrials()])
      setSelectedTrial(null)
    } catch (error) {
      console.error('Error updating trials:', error)
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setUpdatingtrial(null)
    }
  }

  const handleDeleteOrder = async (orderId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette commande ? Cette action est irréversible.')) {
      return
    }

    try {
      setDeleting(orderId)
      
      await deleteOrder(orderId)
      
      toast.success('Commande supprimée avec succès')
      
      await Promise.all([fetchOrders(), fetchStats()])
    } catch (error) {
      console.error('Error deleting order:', error)
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeleting(null)
    }
  }

  const handleDeleteTrialRequest = async (requestId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette demande d\'essai ? Cette action est irréversible.')) {
      return
    }

    try {
      setDeleting(requestId)
      
      await deleteTrialRequest(requestId)
      
      toast.success('Demande d\'essai supprimée avec succès')
      
      await fetchTrials()
    } catch (error) {
      console.error('Error deleting trial request:', error)
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeleting(null)
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

  const getStatusIconTrial = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'processing': return <RefreshCw className="w-4 h-4" />
      case 'pending': return <AlertCircle className="w-4 h-4" />
      case 'rejected': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getStatusLabelTrial = (status) => {
    switch (status) {
      case 'completed': return 'Terminé'
      case 'approved': return 'En cours'
      case 'pending': return 'En attente'
      case 'rejected': return 'Annulé'
      default: return 'Inconnu'
    }
  }

  const getStatusColorTrial = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const isDuplicateEmail = (email) => {
    return duplicateEmails.includes(email)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Panel Administrateur</h1>
        <p className="text-gray-600">Gérez vos commandes et surveillez votre activité</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-8">
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
                <CardTitle className="text-xs sm:text-sm font-medium">Commandes</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold">{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  +{stats.pendingOrders} en attente
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Utilisateurs</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Clients
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Revenus</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm sm:text-lg font-bold">
                  {stats.totalRevenueCDF.toLocaleString()} 
                  <span className="text-xs ml-1">CDF</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Terminées
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Essais</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold">{stats.trialRequests}</div>
                <p className="text-xs text-muted-foreground">
                  En attente
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
          <TabsTrigger value="demande" className="bg-purple-600 ">Demande d'essaie</TabsTrigger>
        </TabsList>

         {/* Commandes */}
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
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Voir détails
                          </Button>
                          
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteOrder(order.id)}
                            disabled={deleting === order.id}
                          >
                            {deleting === order.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <Trash2 className="w-4 h-4 mr-2" />
                            )}
                            Supprimer
                          </Button>
                        </div>

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
        
        {/* activité recent */}
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

        {/* demandes d'essaie */}
        <TabsContent value="demande" className="space-y-6">
          {/* Filtres */}
          <Card>
            <CardHeader>
              <CardTitle>Filtrer les demandes d'essaie</CardTitle>
              {duplicateEmails.length > 0 && (
                <CardDescription className="text-orange-600">
                  ⚠️ {duplicateEmails.length} email(s) avec des demandes multiples détecté(s)
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les demandes</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="processing">En cours</SelectItem>
                    <SelectItem value="completed">Terminées</SelectItem>
                    <SelectItem value="cancelled">Annulées</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={fetchTrials} variant="outline" disabled={trialsLoading}>
                  {trialsLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                  Actualiser
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Liste des demandes */}
          <Card>
            <CardHeader>
              <CardTitle>Demandes ({trials.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {trialsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <OrderCardSkeleton key={i} />
                  ))}
                </div>
              ) : trials.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aucune demande trouvée
                </div>
              ) : (
                <div className="space-y-4">
                  {trials.map((trial) => (
                    <div 
                      key={trial.id} 
                      className={`border rounded-lg p-4 hover:bg-gray-50 ${
                        isDuplicateEmail(trial.email) 
                          ? 'bg-orange-50 border-orange-200' 
                          : 'bg-blue-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">#{trial.id}</span>
                        {isDuplicateEmail(trial.email) && (
                          <Badge variant="destructive" className="text-xs">
                            Email dupliqué
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between my-3">
                        <div className="flex items-center space-x-3">
                          <Badge className={getStatusColorTrial(trial.status)}>
                            <div className="flex items-center space-x-1">
                              {getStatusIconTrial(trial.status)}
                              <span>{getStatusLabelTrial(trial.status)}</span>
                            </div>
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(trial.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-gray-900">
                        <div className="flex flex-col items-start">
                          <div className="text-sm font-medium">
                            {trial.name || 'N/A'}
                          </div>
                          <div className={`text-sm ${isDuplicateEmail(trial.email) ? 'font-semibold text-orange-700' : ''}`}>
                            {trial.email || 'N/A'}
                          </div>
                          <div className="text-sm">
                            {trial.phone || 'N/A'}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm text-gray-600">
                            Plateforme : {trial.platform || 'N/A'} 
                          </div>
                          <div className="text-sm text-gray-600">
                            Service : {trial.service || 'N/A'} 
                          </div>
                          <div className="text-sm text-gray-600">
                            Lien : {trial.target_link || 'N/A'} 
                          </div>
                          <div className="text-sm text-gray-600">
                            Notes: {trial.notes || 'N/A'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteTrialRequest(trial.id)}
                            disabled={deleting === trial.id}
                          >
                            {deleting === trial.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <Trash2 className="w-4 h-4 mr-2" />
                            )}
                            Supprimer
                          </Button>
                        </div>

                        <div className="flex space-x-2">
                          {trial.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleUpdateTrialStatus(trial.id, 'approved')}
                                disabled={updatingtrial === trial.id}
                              >
                                {updatingtrial === trial.id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                ) : null}
                                Accepter
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleUpdateTrialStatus(trial.id, 'rejected')}
                                disabled={updatingtrial === trial.id}
                              >
                                {updatingtrial === trial.id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                ) : null}
                                Refuser
                              </Button>
                            </>
                          )}
                          {trial.status === 'approved' && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateTrialStatus(trial.id, 'completed')}
                              disabled={updatingtrial === trial.id}
                            >
                              {updatingtrial === trial.id ? (
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
      </Tabs>

      {/* Modal détails commande */}
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

      {/* Modal détails demandes */}
      {selectedTrial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Détails de la demande</h2>
                <Button variant="outline" onClick={() => setSelectedTrial(null)}>
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
                      <span className="font-medium">ID commande: </span>
                      {selectedTrial.id}
                    </div>
                    <div>
                      <span className="font-medium">Statut: </span>
                      <Badge className={getStatusColorTrial(selectedTrial.status)}>
                        {getStatusLabelTrial(selectedTrial.status)}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Date: </span>
                      {new Date(selectedTrial.created_at).toLocaleString('fr-FR')}
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
                      {selectedTrial.name}
                    </div>
                    <div>
                      <span className="font-medium">Email: </span>
                      <span className={isDuplicateEmail(selectedTrial.email) ? 'font-semibold text-orange-700' : ''}>
                        {selectedTrial.email}
                        {isDuplicateEmail(selectedTrial.email) && (
                          <Badge variant="destructive" className="ml-2 text-xs">
                            Dupliqué
                          </Badge>
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Téléphone: </span>
                      {selectedTrial.phone}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Services commandés */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Services Demandés</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div>Service : <h4 className="font-medium inline">{selectedTrial.service}</h4></div>
                        <p className="text-sm text-gray-600 capitalize">
                          Plateforme : {selectedTrial.platform}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 truncate">
                      Lien: {selectedTrial.target_link}
                    </div>
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
                        value={selectedTrial.status}
                        onValueChange={(newStatus) => {
                          if (newStatus !== selectedTrial.status) {
                            handleUpdateTrialStatus(selectedTrial.id, newStatus)
                          }
                        }}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="approved">Approuvé</SelectItem>
                          <SelectItem value="completed">Terminé</SelectItem>
                          <SelectItem value="rejected">Rejeté</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Notes administrateur
                      </label>
                      <Textarea
                        placeholder="Ajouter des notes internes..."
                        defaultValue={selectedTrial.admin_notes || ''}
                        rows={3}
                        onBlur={(e) => {
                          if (e.target.value !== selectedTrial.admin_notes) {
                            handleUpdateTrialStatus(
                              selectedTrial.id, 
                              selectedTrial.status, 
                              e.target.value
                            )
                          }
                        }}
                      />
                    </div>

                    {selectedTrial.notes && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Notes du client
                        </label>
                        <div className="p-3 bg-gray-50 rounded-md text-sm">
                          {selectedTrial.notes}
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