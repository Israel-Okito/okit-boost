// src/components/admin/PaymentsManager.jsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Eye,
  Download,
  Filter,
  RefreshCw,
  TrendingUp,
  CreditCard,
  Smartphone,
  DollarSign
} from "lucide-react"
import { toast } from "sonner"

export function PaymentsManager() {
  const [payments, setPayments] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '',
    method: '',
    dateFrom: '',
    dateTo: '',
    search: ''
  })
  const [selectedPayment, setSelectedPayment] = useState(null)

  useEffect(() => {
    fetchPayments()
    fetchPaymentStats()
  }, [filters])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await fetch(`/api/admin/payments?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setPayments(data.payments || [])
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast.error('Erreur lors du chargement des paiements')
    } finally {
      setLoading(false)
    }
  }

  const fetchPaymentStats = async () => {
    try {
      const response = await fetch('/api/admin/payments/stats')
      const data = await response.json()

      if (response.ok) {
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching payment stats:', error)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'REFUSED':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'CANCELLED':
        return <AlertCircle className="w-4 h-4 text-orange-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'ACCEPTED': return 'Accepté'
      case 'PENDING': return 'En attente'
      case 'REFUSED': return 'Refusé'
      case 'CANCELLED': return 'Annulé'
      default: return 'Inconnu'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACCEPTED': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'REFUSED': return 'bg-red-100 text-red-800'
      case 'CANCELLED': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentMethodIcon = (method) => {
    if (method?.toLowerCase().includes('orange')) return '🟠'
    if (method?.toLowerCase().includes('airtel')) return '🔴'
    if (method?.toLowerCase().includes('mpesa')) return '🔵'
    if (method?.toLowerCase().includes('mtn')) return '🟡'
    return <CreditCard className="w-4 h-4" />
  }

  const refreshPaymentStatus = async (transactionId) => {
    try {
      const response = await fetch(`/api/payments/cinetpay?transactionId=${transactionId}`)
      const data = await response.json()

      if (response.ok) {
        toast.success('Statut mis à jour')
        fetchPayments()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error refreshing payment:', error)
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const exportPayments = async () => {
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await fetch(`/api/admin/payments/export?${params.toString()}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success('Export téléchargé')
      } else {
        throw new Error('Erreur lors de l\'export')
      }
    } catch (error) {
      console.error('Error exporting payments:', error)
      toast.error('Erreur lors de l\'export')
    }
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTransactions}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.todayTransactions} aujourd'hui
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paiements Réussis</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.successfulTransactions}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.successfulTransactions / stats.totalTransactions) * 100).toFixed(1)}% de succès
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenus CDF</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalRevenueCDF?.toLocaleString()} CDF
              </div>
              <p className="text-xs text-muted-foreground">
                Revenus totaux en francs congolais
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenus USD</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.totalRevenueUSD?.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Revenus totaux en dollars
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytiques</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          {/* Filtres */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Filtres
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="search">Recherche</Label>
                  <Input
                    id="search"
                    placeholder="Transaction ID, email..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="status">Statut</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tous les statuts</SelectItem>
                      <SelectItem value="ACCEPTED">Accepté</SelectItem>
                      <SelectItem value="PENDING">En attente</SelectItem>
                      <SelectItem value="REFUSED">Refusé</SelectItem>
                      <SelectItem value="CANCELLED">Annulé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="method">Méthode</Label>
                  <Select
                    value={filters.method}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, method: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les méthodes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Toutes les méthodes</SelectItem>
                      <SelectItem value="orange">Orange Money</SelectItem>
                      <SelectItem value="airtel">Airtel Money</SelectItem>
                      <SelectItem value="mtn">MTN Mobile Money</SelectItem>
                      <SelectItem value="moov">Moov Money</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dateFrom">Date de début</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="dateTo">Date de fin</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 mt-4">
                <Button onClick={fetchPayments} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
                <Button variant="outline" onClick={exportPayments}>
                  <Download className="w-4 h-4 mr-2" />
                  Exporter
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Liste des transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Transactions de paiement</CardTitle>
              <CardDescription>
                {payments.length} transaction(s) trouvée(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Commande</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Méthode</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                        Chargement...
                      </TableCell>
                    </TableRow>
                  ) : payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        Aucune transaction trouvée
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div className="font-mono text-sm">
                            {payment.transaction_id}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {payment.orders?.order_number || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{payment.orders?.customer_name}</div>
                            <div className="text-sm text-gray-500">{payment.orders?.customer_email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold">
                            {payment.amount} {payment.currency}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getPaymentMethodIcon(payment.payment_method)}
                            <span className="capitalize text-sm">
                              {payment.payment_method || 'N/A'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(payment.status)}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(payment.status)}
                              <span>{getStatusLabel(payment.status)}</span>
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(payment.created_at).toLocaleDateString('fr-FR')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(payment.created_at).toLocaleTimeString('fr-FR')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedPayment(payment)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Détails de la transaction</DialogTitle>
                                  <DialogDescription>
                                    Transaction ID: {payment.transaction_id}
                                  </DialogDescription>
                                </DialogHeader>
                                <PaymentDetails payment={payment} />
                              </DialogContent>
                            </Dialog>

                            {payment.status === 'PENDING' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => refreshPaymentStatus(payment.transaction_id)}
                              >
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <PaymentAnalytics />
        </TabsContent>

        <TabsContent value="webhooks">
          <WebhookEvents />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Composant pour les détails d'une transaction
function PaymentDetails({ payment }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informations transaction */}
        <Card>
          <CardHeader>
            <CardTitle>Informations Transaction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="font-medium">Transaction ID:</span>
              <span className="font-mono text-sm">{payment.transaction_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Statut:</span>
              <Badge className={getStatusColor(payment.status)}>
                {getStatusLabel(payment.status)}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Montant:</span>
              <span className="font-semibold">{payment.amount} {payment.currency}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Méthode:</span>
              <span className="capitalize">{payment.payment_method}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Provider:</span>
              <span className="capitalize">{payment.provider}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Token:</span>
              <span className="font-mono text-xs">{payment.payment_token || 'N/A'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Informations commande */}
        {payment.orders && (
          <Card>
            <CardHeader>
              <CardTitle>Informations Commande</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">Numéro:</span>
                <span>{payment.orders.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Client:</span>
                <span>{payment.orders.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Email:</span>
                <span>{payment.orders.customer_email}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Téléphone:</span>
                <span>{payment.orders.customer_phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Statut commande:</span>
                <span className="capitalize">{payment.orders.status}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dates */}
      <Card>
        <CardHeader>
          <CardTitle>Historique</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="font-medium">Créé le:</span>
            <span>{new Date(payment.created_at).toLocaleString('fr-FR')}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Mis à jour le:</span>
            <span>{new Date(payment.updated_at).toLocaleString('fr-FR')}</span>
          </div>
          {payment.completed_at && (
            <div className="flex justify-between">
              <span className="font-medium">Complété le:</span>
              <span>{new Date(payment.completed_at).toLocaleString('fr-FR')}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Réponse du provider */}
      {payment.provider_response && (
        <Card>
          <CardHeader>
            <CardTitle>Réponse Provider</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
              {JSON.stringify(JSON.parse(payment.provider_response), null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Composant pour les analytiques
function PaymentAnalytics() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analytiques de Paiement</CardTitle>
        <CardDescription>
          Statistiques détaillées sur les performances des paiements
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-gray-500">
          <TrendingUp className="w-16 h-16 mx-auto mb-4" />
          <p>Analytiques avancées à implémenter</p>
          <p className="text-sm">Graphiques des revenus, taux de succès, etc.</p>
        </div>
      </CardContent>
    </Card>
  )
}

// Composant pour les événements webhook
function WebhookEvents() {
  const [webhooks, setWebhooks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWebhooks()
  }, [])

  const fetchWebhooks = async () => {
    try {
      const response = await fetch('/api/admin/webhooks')
      const data = await response.json()

      if (response.ok) {
        setWebhooks(data.webhooks || [])
      }
    } catch (error) {
      console.error('Error fetching webhooks:', error)
      toast.error('Erreur lors du chargement des webhooks')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Smartphone className="w-5 h-5 mr-2" />
          Événements Webhook
        </CardTitle>
        <CardDescription>
          Historique des notifications reçues de CinetPay
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            Chargement...
          </div>
        ) : webhooks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="w-16 h-16 mx-auto mb-4" />
            <p>Aucun événement webhook trouvé</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type d'événement</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.map((webhook) => (
                <TableRow key={webhook.id}>
                  <TableCell>
                    <Badge variant="outline">{webhook.event_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{webhook.transaction_id}</span>
                  </TableCell>
                  <TableCell>
                    {webhook.status && (
                      <Badge className={getStatusColor(webhook.status)}>
                        {getStatusLabel(webhook.status)}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="capitalize">{webhook.provider}</span>
                  </TableCell>
                  <TableCell>
                    {new Date(webhook.created_at).toLocaleString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Détails Webhook</DialogTitle>
                          <DialogDescription>
                            {webhook.event_type} - {webhook.transaction_id}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Card>
                            <CardHeader>
                              <CardTitle>Payload</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                                {JSON.stringify(webhook.payload, null, 2)}
                              </pre>
                            </CardContent>
                          </Card>
                          {webhook.error_message && (
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-red-600">Erreur</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="bg-red-50 p-4 rounded-lg">
                                  <p className="text-red-700">{webhook.error_message}</p>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}