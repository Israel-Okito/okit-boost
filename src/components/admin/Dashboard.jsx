/**
 * Tableau de bord administrateur avancé avec statistiques en temps réel
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  ShoppingCart, 
  DollarSign, 
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Target,
  Zap,
  Eye,
  Download
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
import { ORDER_STATUS, PAYMENT_STATUS } from '@/lib/constants/app'
import { StatsCardSkeleton, DataListSkeleton } from '@/components/ui/skeletons'
import TransactionsManager from './TransactionsManager'

const Dashboard = () => {
  // États
  const [stats, setStats] = useState(null)
  const [realtimeData, setRealtimeData] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(false) // Désactivé pour optimiser les performances
  const [selectedPeriod, setSelectedPeriod] = useState('7d')
  const [alerts, setAlerts] = useState([])

  /**
   * Récupère les statistiques générales
   */
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/stats?period=${selectedPeriod}`)
      const data = await response.json()
      
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
    }
  }, [selectedPeriod])

  /**
   * Récupère les données en temps réel
   */
  const fetchRealtimeData = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/stats/realtime')
      const data = await response.json()
      
      if (data.success) {
        setRealtimeData(data.data)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des données temps réel:', error)
    }
  }, [])

  /**
   * Récupère l'activité récente
   */
  const fetchRecentActivity = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/activity?limit=20')
      const data = await response.json()
      
      if (data.success) {
        setRecentActivity(data.activities)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'activité:', error)
    }
  }, [])

  /**
   * Récupère les alertes système
   */
  const fetchAlerts = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/alerts')
      const data = await response.json()
      
      if (data.success) {
        setAlerts(data.alerts)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des alertes:', error)
    }
  }, [])

  /**
   * Actualise toutes les données
   */
  const refreshAll = useCallback(async () => {
    setLoading(true)
    await Promise.all([
      fetchStats(),
      fetchRealtimeData(),
      fetchRecentActivity(),
      fetchAlerts()
    ])
    setLoading(false)
  }, [fetchStats, fetchRealtimeData, fetchRecentActivity, fetchAlerts])

  // Chargement initial
  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchRealtimeData()
      fetchRecentActivity()
      fetchAlerts()
    }, 30000) // Toutes les 30 secondes

    return () => clearInterval(interval)
  }, [autoRefresh, fetchRealtimeData, fetchRecentActivity, fetchAlerts])

  // Refresh des stats quand la période change
  useEffect(() => {
    if (stats) {
      fetchStats()
    }
  }, [selectedPeriod, fetchStats])

  /**
   * Calcule le pourcentage de variation
   */
  const calculateGrowth = useCallback((current, previous) => {
    if (!previous || previous === 0) return 0
    return Math.round(((current - previous) / previous) * 100)
  }, [])

  /**
   * Formate les données pour les graphiques
   */
  const formatChartData = useCallback((data) => {
    if (!data) return []
    return data.map(item => ({
      ...item,
      date: new Date(item.date).toLocaleDateString('fr-FR', { 
        month: 'short', 
        day: 'numeric' 
      })
    }))
  }, [])

  /**
   * Couleurs pour les graphiques
   */
  const chartColors = {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B',
    danger: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B'
  }

  if (loading && !stats) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }, (_, i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Chargement...</CardTitle>
            </CardHeader>
            <CardContent>
              <DataListSkeleton count={3} />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tableau de Bord Admin</h1>
          <p className="text-gray-600">
            Vue d'ensemble en temps réel de votre plateforme
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="1d">24 heures</option>
            <option value="7d">7 jours</option>
            <option value="30d">30 jours</option>
            <option value="3m">3 mois</option>
          </select>
          <Button
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50' : ''}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto
          </Button>
          <Button onClick={refreshAll} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Alertes système */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.slice(0, 3).map((alert, index) => (
            <Alert key={index} className={
              alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
              alert.severity === 'warning' ? 'border-yellow-500 bg-yellow-50' :
              'border-blue-500 bg-blue-50'
            }>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <span className="font-medium">{alert.title}</span>: {alert.message}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenus */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.revenue?.total || 0, 'USD')}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {calculateGrowth(stats?.revenue?.total, stats?.revenue?.previous) >= 0 ? (
                <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1 text-red-600" />
              )}
              {Math.abs(calculateGrowth(stats?.revenue?.total, stats?.revenue?.previous))}%
              <span className="ml-1">vs période précédente</span>
            </div>
          </CardContent>
        </Card>

        {/* Commandes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(stats?.orders?.total || 0)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <div className="flex items-center">
                <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                {stats?.orders?.completed || 0} terminées
              </div>
              <div className="flex items-center ml-3">
                <Clock className="w-3 h-3 mr-1 text-yellow-600" />
                {stats?.orders?.pending || 0} en attente
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Utilisateurs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(stats?.users?.total || 0)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Activity className="w-3 h-3 mr-1 text-green-600" />
              {stats?.users?.active || 0} actifs aujourd'hui
            </div>
          </CardContent>
        </Card>

        {/* Taux de conversion */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Conversion</CardTitle>
            <Target className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.conversion?.rate || 0).toFixed(1)}%
            </div>
            <Progress 
              value={stats?.conversion?.rate || 0} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.conversion?.conversions || 0} conversions sur {stats?.conversion?.visits || 0} visites
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques et tableaux */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5 gap-1">
          <TabsTrigger value="overview" className="text-xs lg:text-sm">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="revenue" className="text-xs lg:text-sm">Revenus</TabsTrigger>
          <TabsTrigger value="orders" className="text-xs lg:text-sm">Commandes</TabsTrigger>
          <TabsTrigger value="users" className="text-xs lg:text-sm">Utilisateurs</TabsTrigger>
          <TabsTrigger value="transactions" className="text-xs lg:text-sm col-span-3 lg:col-span-1">Transactions</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Évolution des revenus */}
            <Card>
              <CardHeader>
                <CardTitle>Évolution des Revenus</CardTitle>
                <CardDescription>
                  Revenus quotidiens sur la période sélectionnée
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={formatChartData(stats?.revenue?.chart)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value, 'USD')} />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke={chartColors.primary}
                      fill={chartColors.primary}
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Répartition des commandes */}
            <Card>
              <CardHeader>
                <CardTitle>État des Commandes</CardTitle>
                <CardDescription>
                  Répartition par statut
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats?.orders?.byStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {stats?.orders?.byStatus?.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            entry.status === ORDER_STATUS.COMPLETED ? chartColors.success :
                            entry.status === ORDER_STATUS.PENDING ? chartColors.warning :
                            entry.status === ORDER_STATUS.PROCESSING ? chartColors.primary :
                            chartColors.danger
                          } 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Activité récente et métriques temps réel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Activité récente */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Activité Récente</CardTitle>
                <CardDescription>
                  Dernières actions sur la plateforme
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        {activity.type === 'order' && <ShoppingCart className="w-4 h-4 text-blue-600" />}
                        {activity.type === 'payment' && <DollarSign className="w-4 h-4 text-green-600" />}
                        {activity.type === 'user' && <Users className="w-4 h-4 text-purple-600" />}
                        {activity.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {timeAgo(activity.timestamp)}
                        </p>
                      </div>
                      <Badge variant={
                        activity.severity === 'high' ? 'destructive' :
                        activity.severity === 'medium' ? 'secondary' :
                        'outline'
                      }>
                        {activity.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Métriques temps réel */}
            <Card>
              <CardHeader>
                <CardTitle>Temps Réel</CardTitle>
                <CardDescription>
                  Activité en cours
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Utilisateurs connectés</span>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                    <span className="font-bold">{realtimeData?.activeUsers || 0}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Commandes aujourd'hui</span>
                  <span className="font-bold">{realtimeData?.todayOrders || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Revenus aujourd'hui</span>
                  <span className="font-bold">
                    {formatCurrency(realtimeData?.todayRevenue || 0, 'USD')}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Taux d'erreur</span>
                  <div className="flex items-center">
                    <span className="font-bold text-sm mr-2">
                      {(realtimeData?.errorRate || 0).toFixed(2)}%
                    </span>
                    {(realtimeData?.errorRate || 0) > 5 && (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="w-4 h-4 mr-2" />
                    Voir détails
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Autres onglets - Revenus, Commandes, Utilisateurs */}
        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Analyse des Revenus</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={formatChartData(stats?.revenue?.detailed)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value, 'USD')} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke={chartColors.primary}
                    strokeWidth={2}
                    name="Revenus CinetPay"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Commandes par Jour</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={formatChartData(stats?.orders?.chart)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill={chartColors.primary} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Services Populaires</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.orders?.topServices?.map((service, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{service.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{service.count}</span>
                        <Progress value={(service.count / stats.orders.topServices[0].count) * 100} className="w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Croissance des Utilisateurs</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={formatChartData(stats?.users?.chart)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="new" 
                      stackId="1"
                      stroke={chartColors.secondary}
                      fill={chartColors.secondary}
                      name="Nouveaux"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="returning" 
                      stackId="1"
                      stroke={chartColors.primary}
                      fill={chartColors.primary}
                      name="Récurrents"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métriques Utilisateurs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Taux de rétention</span>
                  <span className="font-bold">{(stats?.users?.retention || 0).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Durée de session moyenne</span>
                  <span className="font-bold">{stats?.users?.avgSessionDuration || '0m'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Pages par session</span>
                  <span className="font-bold">{(stats?.users?.avgPagesPerSession || 0).toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Taux de rebond</span>
                  <span className="font-bold">{(stats?.users?.bounceRate || 0).toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Onglet Transactions */}
        <TabsContent value="transactions">
          <TransactionsManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Dashboard
