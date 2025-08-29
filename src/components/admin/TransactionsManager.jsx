/**
 * Gestionnaire des transactions avec revenus pour le dashboard admin
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Users, 
  CreditCard,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { formatCurrency, formatNumber, timeAgo } from '@/lib/utils/common'

const TransactionsManager = () => {
  // États
  const [transactions, setTransactions] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '',
    period: '30d',
    page: 1,
    limit: 20,
    sortBy: 'created_at',
    sortOrder: 'desc'
  })
  const [pagination, setPagination] = useState({})

  /**
   * Récupérer les transactions
   */
  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString(),
        period: filters.period,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      })

      if (filters.status) {
        params.append('status', filters.status)
      }

      const response = await fetch(`/api/admin/transactions?${params}`)
      const data = await response.json()

      if (data.success) {
        setTransactions(data.transactions)
        setStats(data.stats)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Erreur récupération transactions:', error)
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Chargement initial
  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  /**
   * Gestionnaires de filtres
   */
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value // Reset page sauf si on change la page
    }))
  }

  /**
   * Gestionnaire de pagination
   */
  const handlePageChange = (newPage) => {
    handleFilterChange('page', newPage)
  }

  /**
   * Formater le statut avec badge coloré
   */
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      completed: { label: 'Complété', color: 'bg-green-100 text-green-800' },
      pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
      failed: { label: 'Échoué', color: 'bg-red-100 text-red-800' },
      cancelled: { label: 'Annulé', color: 'bg-gray-100 text-gray-800' }
    }

    const config = statusConfig[status] || statusConfig.pending
    
    return (
      <Badge className={`${config.color} border-0`}>
        <div className="flex items-center gap-1">
          {status === 'completed' && <CheckCircle className="w-3 h-3" />}
          {status === 'pending' && <Clock className="w-3 h-3" />}
          {status === 'failed' && <XCircle className="w-3 h-3" />}
          {status === 'cancelled' && <AlertTriangle className="w-3 h-3" />}
          {config.label}
        </div>
      </Badge>
    )
  }

  /**
   * Couleurs pour les graphiques
   */
  const chartColors = {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B',
    danger: '#EF4444'
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenus */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.totalRevenue?.usd || 0, 'USD')}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats?.totalRevenue?.cdf || 0, 'CDF')} équivalent
            </p>
          </CardContent>
        </Card>

        {/* Total Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(stats?.totalTransactions || 0)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
              {stats?.byStatus?.completed || 0} réussies
            </div>
          </CardContent>
        </Card>

        {/* Taux de Conversion */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Conversion</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.conversionRate || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Transactions réussies
            </p>
          </CardContent>
        </Card>

        {/* Échecs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Échecs</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.byStatus?.failed || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Transactions échouées
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Toutes les Transactions</CardTitle>
              <CardDescription>
                Gérez et visualisez toutes les transactions avec détails des utilisateurs
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchTransactions}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualiser
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtres */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Select 
              value={filters.status} 
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les statuts</SelectItem>
                <SelectItem value="completed">Complété</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="failed">Échoué</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.period} 
              onValueChange={(value) => handleFilterChange('period', value)}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Aujourd'hui</SelectItem>
                <SelectItem value="7d">7 derniers jours</SelectItem>
                <SelectItem value="30d">30 derniers jours</SelectItem>
                <SelectItem value="90d">90 derniers jours</SelectItem>
                <SelectItem value="all">Toutes</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.limit.toString()} 
              onValueChange={(value) => handleFilterChange('limit', parseInt(value))}
            >
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="Limite" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tableau des transactions */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Méthode</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Commande</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Skeleton loading
                  Array.from({ length: 5 }, (_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                          Chargement...
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Aucune transaction trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="font-medium text-sm">
                          {transaction.transactionId}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ID: {transaction.id.slice(0, 8)}...
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="font-medium text-sm">
                          {transaction.user?.name || transaction.customer?.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {transaction.user?.email || transaction.customer?.email}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="font-medium">
                          {formatCurrency(transaction.amountUSD, 'USD')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="outline">
                          {transaction.paymentMethod || 'N/A'}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <StatusBadge status={transaction.status} />
                      </TableCell>
                      
                      <TableCell>
                        {transaction.order ? (
                          <div className="text-sm">
                            <div className="font-medium">
                              #{transaction.order.orderNumber}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {transaction.order.status}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Aucune commande
                          </span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          {timeAgo(transaction.dates.created)}
                        </div>
                        {transaction.dates.completed && (
                          <div className="text-xs text-muted-foreground">
                            Complété: {timeAgo(transaction.dates.completed)}
                          </div>
                        )}
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="text-sm text-muted-foreground">
                Affichage {((pagination.page - 1) * pagination.limit) + 1} à{' '}
                {Math.min(pagination.page * pagination.limit, pagination.totalCount)} sur{' '}
                {pagination.totalCount} transactions
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Précédent
                </Button>
                <div className="text-sm">
                  Page {pagination.page} sur {pagination.totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                >
                  Suivant
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default TransactionsManager
