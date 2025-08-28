"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Search,
  Filter,
  RefreshCw,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Users,
  FileText,
  Phone,
  Mail,
  Link,
  Settings
} from "lucide-react"
import { toast } from "sonner"
// Fonction simple pour formater les dates
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const formatTime = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDateTime = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const statusConfig = {
  'pending': { 
    label: 'En attente', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock 
  },
  'approved': { 
    label: 'Approuvé', 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: CheckCircle 
  },
  'completed': { 
    label: 'Terminé', 
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle 
  },
  'rejected': { 
    label: 'Rejeté', 
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle 
  }
}

export default function TrialsManager() {
  const [trials, setTrials] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedTrial, setSelectedTrial] = useState(null)
  const [showTrialDetails, setShowTrialDetails] = useState(false)
  const [updating, setUpdating] = useState(null)
  const [duplicateEmails, setDuplicateEmails] = useState([])

  // Statistiques
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    completed: 0,
    rejected: 0
  })

  useEffect(() => {
    fetchTrials()
  }, [statusFilter])

  const fetchTrials = async () => {
    try {
      setLoading(true)
      const url = statusFilter === 'all' 
        ? '/api/admin/trial-requests' 
        : `/api/admin/trial-requests?status=${statusFilter}`
      
      const response = await fetch(url, { cache: 'no-store' })
      const data = await response.json()
      
      if (data.success) {
        setTrials(data.trials || [])
        calculateStats(data.trials || [])
        
        // Identifier les emails dupliqués
        const emailCounts = {}
        data.trials?.forEach(trial => {
          emailCounts[trial.email] = (emailCounts[trial.email] || 0) + 1
        })
        const duplicates = Object.keys(emailCounts).filter(email => emailCounts[email] > 1)
        setDuplicateEmails(duplicates)
      }
    } catch (error) {
      console.error('Error fetching trials:', error)
      toast.error('Erreur lors du chargement des demandes d\'essai')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (trialsData) => {
    const stats = {
      total: trialsData.length,
      pending: trialsData.filter(t => t.status === 'pending').length,
      approved: trialsData.filter(t => t.status === 'approved').length,
      completed: trialsData.filter(t => t.status === 'completed').length,
      rejected: trialsData.filter(t => t.status === 'rejected').length
    }
    setStats(stats)
  }

  const handleUpdateStatus = async (trialId, newStatus, adminNotes = '') => {
    try {
      setUpdating(trialId)
      
      const response = await fetch(`/api/admin/trial-requests/${trialId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          admin_notes: adminNotes
        })
      })

      if (response.ok) {
        toast.success('Statut mis à jour')
        fetchTrials()
        if (selectedTrial && selectedTrial.id === trialId) {
          setSelectedTrial(null)
          setShowTrialDetails(false)
        }
      } else {
        throw new Error('Erreur lors de la mise à jour')
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du statut')
    } finally {
      setUpdating(null)
    }
  }

  const handleDeleteTrial = async (trialId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette demande d\'essai ?')) return

    try {
      const response = await fetch(`/api/admin/trial-requests/${trialId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Demande d\'essai supprimée')
        fetchTrials()
      } else {
        throw new Error('Erreur lors de la suppression')
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const isDuplicateEmail = (email) => {
    return duplicateEmails.includes(email)
  }

  const filteredTrials = trials.filter(trial => {
    const matchesSearch = !searchTerm || 
      trial.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trial.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trial.phone?.includes(searchTerm) ||
      trial.service?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trial.platform?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gestion des Demandes d'Essai</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Demandes</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Approuvées</p>
                <p className="text-2xl font-bold text-blue-600">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Terminées</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-medium">Rejetées</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerte pour emails dupliqués */}
      {duplicateEmails.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-orange-800">
                  ⚠️ {duplicateEmails.length} email(s) avec des demandes multiples détecté(s)
                </p>
                <p className="text-xs text-orange-600">
                  Vérifiez les demandes pour éviter les abus
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtres et actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Demandes d'Essai Gratuit</CardTitle>
              <CardDescription>Gérez toutes les demandes d'essai clients</CardDescription>
            </div>
            <Button onClick={fetchTrials} size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filtres */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom, email, service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {Object.entries(statusConfig).map(([status, config]) => (
                  <SelectItem key={status} value={status}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Liste des demandes */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Demandeur</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Service Demandé</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrials.map((trial) => {
                  const status = statusConfig[trial.status] || statusConfig.pending
                  const StatusIcon = status.icon
                  
                  return (
                    <TableRow 
                      key={trial.id} 
                      className={`hover:bg-gray-50 ${
                        isDuplicateEmail(trial.email) 
                          ? 'bg-orange-50 border-l-4 border-l-orange-400' 
                          : ''
                      }`}
                    >
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium flex items-center space-x-2">
                            <span>{trial.name || 'N/A'}</span>
                            {isDuplicateEmail(trial.email) && (
                              <Badge variant="destructive" className="text-xs">
                                Email dupliqué
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">#{trial.id.slice(0, 8)}</div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1 text-sm">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span className={isDuplicateEmail(trial.email) ? 'font-semibold text-orange-700' : ''}>
                              {trial.email || 'N/A'}
                            </span>
                          </div>
                          {trial.phone && (
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <span>{trial.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{trial.service || 'N/A'}</div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {trial.platform || 'N/A'}
                            </Badge>
                          </div>
                          {trial.target_link && (
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Link className="w-3 h-3" />
                              <span className="truncate max-w-32">{trial.target_link}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className={status.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">
                            {formatDate(trial.created_at)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatTime(trial.created_at)}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedTrial(trial)
                              setShowTrialDetails(true)
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          <Select
                            value={trial.status}
                            onValueChange={(newStatus) => handleUpdateStatus(trial.id, newStatus)}
                            disabled={updating === trial.id}
                          >
                            <SelectTrigger className="w-auto h-8 px-2">
                              <Settings className="w-4 h-4" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(statusConfig).map(([status, config]) => (
                                <SelectItem key={status} value={status}>
                                  {config.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteTrial(trial.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {filteredTrials.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune demande d'essai trouvée</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog pour les détails de demande */}
      <Dialog open={showTrialDetails} onOpenChange={setShowTrialDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la demande #{selectedTrial?.id.slice(0, 8)}</DialogTitle>
            <DialogDescription>
              Informations complètes sur cette demande d'essai
            </DialogDescription>
          </DialogHeader>
          
          {selectedTrial && (
            <div className="space-y-6">
              {/* Informations demandeur */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informations Demandeur</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Nom</label>
                      <p className="font-medium">{selectedTrial.name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <div className="flex items-center space-x-2">
                        <p className={`font-medium ${isDuplicateEmail(selectedTrial.email) ? 'text-orange-700' : ''}`}>
                          {selectedTrial.email || 'N/A'}
                        </p>
                        {isDuplicateEmail(selectedTrial.email) && (
                          <Badge variant="destructive" className="text-xs">
                            Dupliqué
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Téléphone</label>
                      <p className="font-medium">{selectedTrial.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Date de demande</label>
                      <p className="font-medium">
                        {formatDateTime(selectedTrial.created_at)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Service demandé */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Service Demandé</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="space-y-1">
                        <div className="font-medium">{selectedTrial.service || 'N/A'}</div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{selectedTrial.platform || 'N/A'}</Badge>
                        </div>
                        {selectedTrial.target_link && (
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Link className="w-3 h-3" />
                            <span className="truncate">{selectedTrial.target_link}</span>
                          </div>
                        )}
                        {selectedTrial.notes && (
                          <div className="mt-2">
                            <label className="text-sm font-medium">Notes du client:</label>
                            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded mt-1">
                              {selectedTrial.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions admin */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions Administrateur</CardTitle>
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
                            handleUpdateStatus(selectedTrial.id, newStatus)
                          }
                        }}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusConfig).map(([status, config]) => (
                            <SelectItem key={status} value={status}>
                              {config.label}
                            </SelectItem>
                          ))}
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
                            handleUpdateStatus(
                              selectedTrial.id, 
                              selectedTrial.status, 
                              e.target.value
                            )
                          }
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
