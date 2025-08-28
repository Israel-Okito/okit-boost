"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  Monitor,
  Users,
  Package,
  ToggleLeft,
  ToggleRight,
  Image,
  Globe
} from "lucide-react"
import { toast } from "sonner"

export default function PlatformsManager() {
  const [platforms, setPlatforms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingPlatform, setEditingPlatform] = useState(null)

  // Formulaire pour nouvelle plateforme
  const [newPlatform, setNewPlatform] = useState({
    id: '',
    name: '',
    description: '',
    icon_url: '',
    color_from: '#3B82F6',
    color_to: '#1D4ED8',
    is_active: true
  })

  useEffect(() => {
    fetchPlatforms()
  }, [])

  const fetchPlatforms = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/platforms')
      const data = await response.json()
      setPlatforms(data.platforms || [])
    } catch (error) {
      console.error('Error fetching platforms:', error)
      toast.error('Erreur lors du chargement des plateformes')
    } finally {
      setLoading(false)
    }
  }

  const handleAddPlatform = async () => {
    try {
      const response = await fetch('/api/admin/platforms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlatform)
      })

      if (response.ok) {
        toast.success('Plateforme ajoutée avec succès')
        setShowAddDialog(false)
        setNewPlatform({
          id: '',
          name: '',
          description: '',
          icon_url: '',
          color_from: '#3B82F6',
          color_to: '#1D4ED8',
          is_active: true
        })
        fetchPlatforms()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la création')
      }
    } catch (error) {
      toast.error(error.message || 'Erreur lors de l\'ajout de la plateforme')
    }
  }

  const handleUpdatePlatform = async (platformId, updates) => {
    try {
      const response = await fetch(`/api/admin/platforms/${platformId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        toast.success('Plateforme mise à jour')
        setShowEditDialog(false)
        setEditingPlatform(null)
        fetchPlatforms()
      } else {
        throw new Error('Erreur lors de la mise à jour')
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const handleEditPlatform = (platform) => {
    setEditingPlatform({
      ...platform
    })
    setShowEditDialog(true)
  }

  const handleSaveEdit = async () => {
    if (!editingPlatform) return

    await handleUpdatePlatform(editingPlatform.id, {
      name: editingPlatform.name,
      description: editingPlatform.description,
      icon_url: editingPlatform.icon_url,
      color_from: editingPlatform.color_from,
      color_to: editingPlatform.color_to,
      is_active: editingPlatform.is_active
    })
  }

  const handleDeletePlatform = async (platformId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette plateforme ? Tous les services associés seront également supprimés.')) return

    try {
      const response = await fetch(`/api/admin/platforms/${platformId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Plateforme supprimée')
        fetchPlatforms()
      } else {
        throw new Error('Erreur lors de la suppression')
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const togglePlatformStatus = async (platformId, currentStatus) => {
    await handleUpdatePlatform(platformId, { is_active: !currentStatus })
  }

  const getGradientStyle = (colorFrom, colorTo) => ({
    background: `linear-gradient(135deg, ${colorFrom}, ${colorTo})`
  })

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gestion des Plateformes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Monitor className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Plateformes</p>
                <p className="text-2xl font-bold">{platforms.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <ToggleRight className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Plateformes Actives</p>
                <p className="text-2xl font-bold text-green-600">
                  {platforms.filter(p => p.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Services Totaux</p>
                <p className="text-2xl font-bold">
                  {platforms.reduce((sum, p) => sum + (p.services_count || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gestion des plateformes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Plateformes Disponibles</CardTitle>
              <CardDescription>Gérez les plateformes sociales supportées</CardDescription>
            </div>
            
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter Plateforme
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>Nouvelle Plateforme</DialogTitle>
                  <DialogDescription>
                    Ajoutez une nouvelle plateforme sociale
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="platform_id">ID Plateforme</Label>
                      <Input
                        value={newPlatform.id}
                        onChange={(e) => setNewPlatform({...newPlatform, id: e.target.value})}
                        placeholder="instagram"
                        className="lowercase"
                      />
                      <p className="text-xs text-gray-500">Utilisé dans les URLs (minuscules, sans espaces)</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">Nom d'affichage</Label>
                      <Input
                        value={newPlatform.name}
                        onChange={(e) => setNewPlatform({...newPlatform, name: e.target.value})}
                        placeholder="Instagram"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      value={newPlatform.description}
                      onChange={(e) => setNewPlatform({...newPlatform, description: e.target.value})}
                      placeholder="Développez votre présence sur Instagram"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="icon_url">URL de l'icône</Label>
                    <Input
                      value={newPlatform.icon_url}
                      onChange={(e) => setNewPlatform({...newPlatform, icon_url: e.target.value})}
                      placeholder="/instagram.webp"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="color_from">Couleur Début</Label>
                      <Input
                        type="color"
                        value={newPlatform.color_from}
                        onChange={(e) => setNewPlatform({...newPlatform, color_from: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="color_to">Couleur Fin</Label>
                      <Input
                        type="color"
                        value={newPlatform.color_to}
                        onChange={(e) => setNewPlatform({...newPlatform, color_to: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* Aperçu du gradient */}
                  <div className="space-y-2">
                    <Label>Aperçu du gradient</Label>
                    <div 
                      className="h-12 rounded-md border"
                      style={getGradientStyle(newPlatform.color_from, newPlatform.color_to)}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleAddPlatform}>
                    <Save className="w-4 h-4 mr-2" />
                    Créer Plateforme
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Dialog d'édition */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>Modifier la Plateforme</DialogTitle>
                  <DialogDescription>
                    Modifiez les informations de cette plateforme
                  </DialogDescription>
                </DialogHeader>
                
                {editingPlatform && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="platform_id">ID Plateforme</Label>
                        <Input
                          value={editingPlatform.id}
                          disabled
                          className="bg-gray-100"
                        />
                        <p className="text-xs text-gray-500">L'ID ne peut pas être modifié</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="name">Nom d'affichage</Label>
                        <Input
                          value={editingPlatform.name}
                          onChange={(e) => setEditingPlatform({...editingPlatform, name: e.target.value})}
                          placeholder="Instagram"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        value={editingPlatform.description}
                        onChange={(e) => setEditingPlatform({...editingPlatform, description: e.target.value})}
                        placeholder="Développez votre présence sur Instagram"
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="icon_url">URL de l'icône</Label>
                      <Input
                        value={editingPlatform.icon_url}
                        onChange={(e) => setEditingPlatform({...editingPlatform, icon_url: e.target.value})}
                        placeholder="/instagram.webp"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="color_from">Couleur Début</Label>
                        <Input
                          type="color"
                          value={editingPlatform.color_from}
                          onChange={(e) => setEditingPlatform({...editingPlatform, color_from: e.target.value})}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="color_to">Couleur Fin</Label>
                        <Input
                          type="color"
                          value={editingPlatform.color_to}
                          onChange={(e) => setEditingPlatform({...editingPlatform, color_to: e.target.value})}
                        />
                      </div>
                    </div>

                    {/* Aperçu du gradient */}
                    <div className="space-y-2">
                      <Label>Aperçu du gradient</Label>
                      <div 
                        className="h-12 rounded-md border"
                        style={getGradientStyle(editingPlatform.color_from, editingPlatform.color_to)}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleSaveEdit}>
                    <Save className="w-4 h-4 mr-2" />
                    Sauvegarder
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plateforme</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Couleurs</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {platforms.map((platform) => (
                  <TableRow key={platform.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        {platform.icon_url && (
                          <div className="w-8 h-8 rounded border flex items-center justify-center overflow-hidden">
                            {/* <img 
                              src={platform.icon_url} 
                              alt={platform.name}
                              className="w-6 h-6"
                              onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.nextSibling.style.display = 'flex'
                              }}
                            /> */}
                            <Globe className="w-4 h-4 text-gray-400"  />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{platform.name}</div>
                          <div className="text-sm text-gray-500">{platform.description}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {platform.id}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {platform.services_count || 0} services
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePlatformStatus(platform.id, platform.is_active)}
                      >
                        {platform.is_active ? (
                          <ToggleRight className="w-5 h-5 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-gray-400" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div 
                        className="w-16 h-6 rounded border"
                        style={getGradientStyle(platform.color_from, platform.color_to)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                                                  <Button variant="ghost" size="sm" onClick={() => handleEditPlatform(platform)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeletePlatform(platform.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
