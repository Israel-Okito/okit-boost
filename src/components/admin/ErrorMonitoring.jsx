/**
 * Composant de monitoring des erreurs pour l'interface admin
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  AlertTriangle, 
  Activity, 
  Clock, 
  Database, 
  RefreshCw, 
  Search,
  Download,
  Trash2,
  Power,
  PowerOff
} from 'lucide-react'

const ErrorMonitoring = () => {
  // États
  const [stats, setStats] = useState(null)
  const [logs, setLogs] = useState([])
  const [circuits, setCircuits] = useState({})
  const [retryStats, setRetryStats] = useState({})
  const [loading, setLoading] = useState(false)
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLogType, setSelectedLogType] = useState('combined')
  const [autoRefresh, setAutoRefresh] = useState(true)

  /**
   * Récupère les statistiques d'erreurs
   */
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/admin/errors?action=stats&timeRange=${selectedTimeRange}&logType=${selectedLogType}`
      )
      const data = await response.json()
      
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedTimeRange, selectedLogType])

  /**
   * Récupère les logs d'erreurs
   */
  const fetchLogs = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/admin/errors?action=logs&logType=error&limit=50&query=${searchQuery}`
      )
      const data = await response.json()
      
      if (data.success) {
        setLogs(data.logs)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des logs:', error)
    }
  }, [searchQuery])

  /**
   * Récupère le statut des circuit breakers
   */
  const fetchCircuits = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/errors?action=circuits')
      const data = await response.json()
      
      if (data.success) {
        setCircuits(data.circuits)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des circuit breakers:', error)
    }
  }, [])

  /**
   * Récupère les statistiques de retry
   */
  const fetchRetryStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/errors?action=retry')
      const data = await response.json()
      
      if (data.success) {
        setRetryStats(data.retryStats)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des stats retry:', error)
    }
  }, [])

  /**
   * Actualise toutes les données
   */
  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchStats(),
      fetchLogs(),
      fetchCircuits(),
      fetchRetryStats()
    ])
  }, [fetchStats, fetchLogs, fetchCircuits, fetchRetryStats])

  /**
   * Actions administratives
   */
  const performAction = useCallback(async (action, params = {}) => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, params })
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert(data.message || 'Action effectuée avec succès')
        await refreshAll()
      } else {
        alert(data.error || 'Erreur lors de l\'action')
      }
    } catch (error) {
      console.error('Erreur lors de l\'action:', error)
      alert('Erreur lors de l\'action')
    } finally {
      setLoading(false)
    }
  }, [refreshAll])

  // Chargement initial et auto-refresh
  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(refreshAll, 30000) // Refresh toutes les 30s
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshAll])

  /**
   * Formate la date
   */
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('fr-FR')
  }

  /**
   * Obtient la couleur selon la sévérité
   */
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'destructive'
      case 'high': return 'secondary'
      case 'medium': return 'default'
      case 'low': return 'outline'
      default: return 'outline'
    }
  }

  /**
   * Obtient l'icône selon l'état du circuit
   */
  const getCircuitIcon = (state) => {
    switch (state) {
      case 'OPEN': return <PowerOff className="w-4 h-4 text-red-500" />
      case 'HALF_OPEN': return <Power className="w-4 h-4 text-yellow-500" />
      case 'CLOSED': return <Power className="w-4 h-4 text-green-500" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Monitoring des Erreurs</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50' : ''}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-refresh
          </Button>
          <Button onClick={refreshAll} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Contrôles */}
      <div className="flex gap-4 items-center">
        <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1h">1 heure</SelectItem>
            <SelectItem value="6h">6 heures</SelectItem>
            <SelectItem value="24h">24 heures</SelectItem>
            <SelectItem value="7d">7 jours</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedLogType} onValueChange={setSelectedLogType}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="combined">Tous</SelectItem>
            <SelectItem value="error">Erreurs</SelectItem>
            <SelectItem value="payment">Paiements</SelectItem>
            <SelectItem value="security">Sécurité</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Rechercher dans les logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Statistiques générales */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Erreurs</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.logs?.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                Dernières {selectedTimeRange}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Circuits Ouverts</CardTitle>
              <PowerOff className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.circuits?.openCircuits || 0}</div>
              <p className="text-xs text-muted-foreground">
                Sur {stats.circuits?.totalCircuits || 0} circuits
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux d'Échec Global</CardTitle>
              <Activity className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round((stats.circuits?.globalFailureRate || 0) * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Global failure rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(stats.logs?.averagePerHour || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Erreurs par heure
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Onglets détaillés */}
      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Logs d'Erreurs</TabsTrigger>
          <TabsTrigger value="circuits">Circuit Breakers</TabsTrigger>
          <TabsTrigger value="retry">Retry Statistics</TabsTrigger>
          <TabsTrigger value="actions">Actions Admin</TabsTrigger>
        </TabsList>

        {/* Logs d'erreurs */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs d'Erreurs Récents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={index} className="border rounded p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={getSeverityColor(log.severity)}>
                            {log.level || log.severity}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {formatDate(log.timestamp)}
                          </span>
                        </div>
                        <p className="font-medium mt-1">{log.message}</p>
                        {log.type && (
                          <p className="text-sm text-gray-600">Type: {log.type}</p>
                        )}
                      </div>
                    </div>
                    {log.stack && (
                      <details className="text-xs text-gray-500">
                        <summary className="cursor-pointer">Stack trace</summary>
                        <pre className="mt-2 whitespace-pre-wrap">{log.stack}</pre>
                      </details>
                    )}
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Aucun log d'erreur trouvé
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Circuit Breakers */}
        <TabsContent value="circuits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>État des Circuit Breakers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(circuits).map(([name, circuit]) => (
                  <div key={name} className="border rounded p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        {getCircuitIcon(circuit.state)}
                        <div>
                          <h3 className="font-medium">{name}</h3>
                          <div className="flex gap-4 text-sm text-gray-600">
                            <span>État: {circuit.state}</span>
                            <span>Échecs: {circuit.failures}</span>
                            <span>Succès: {circuit.successes}</span>
                            <span>Total: {circuit.totalCalls}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => performAction('force_circuit_closed', { circuitName: name })}
                        >
                          Fermer
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => performAction('force_circuit_open', { circuitName: name })}
                        >
                          Ouvrir
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => performAction('reset_circuits', { circuitName: name })}
                        >
                          Reset
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {Object.keys(circuits).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Aucun circuit breaker trouvé
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Retry Statistics */}
        <TabsContent value="retry" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Statistiques de Retry</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(retryStats).map(([name, stats]) => (
                  <div key={name} className="border rounded p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{name}</h3>
                        <div className="grid grid-cols-4 gap-4 text-sm text-gray-600 mt-2">
                          <span>Tentatives: {stats.totalAttempts}</span>
                          <span>Succès: {Math.round(stats.successRate * 100)}%</span>
                          <span>Temps moyen: {Math.round(stats.averageResponseTime)}ms</span>
                          <span>Retries moyen: {stats.averageRetries}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => performAction('reset_retry_stats', { handlerName: name })}
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                ))}
                {Object.keys(retryStats).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Aucune statistique de retry trouvée
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Actions Admin */}
        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actions Administratives</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() => performAction('reset_circuits')}
                  disabled={loading}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset Tous les Circuits
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => performAction('reset_retry_stats')}
                  disabled={loading}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset Stats Retry
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => performAction('export_logs', { format: 'json', timeRange: selectedTimeRange })}
                  disabled={loading}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exporter Logs
                </Button>
                
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm('Êtes-vous sûr de vouloir nettoyer les logs ?')) {
                      performAction('clear_logs', { olderThan: '7d' })
                    }
                  }}
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Nettoyer Logs
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Alertes */}
      {stats?.circuits?.openCircuits > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Attention: {stats.circuits.openCircuits} circuit breaker(s) sont ouverts.
            Cela peut indiquer des problèmes avec les services externes.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default ErrorMonitoring
