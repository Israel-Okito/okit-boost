"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Package, 
  DollarSign,
  Clock,
  Users,
  Eye,
  ToggleLeft,
  ToggleRight
} from "lucide-react"
import { toast } from "sonner"

export default function ServicesManager() {
  const [services, setServices] = useState([])
  const [platforms, setPlatforms] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingService, setEditingService] = useState(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)

  // Formulaire pour nouveau service
  const [newService, setNewService] = useState({
    platform_id: '',
    name: '',
    description: '',
    category: '',
    price_usd: '',
    price_cdf: '',
    min_quantity: '100',
    max_quantity: '10000',
    delivery_time: '0-1 heures',
    quality: 'HIGH',
    is_active: true
  })

  const categories = [
    'followers',
    'likes', 
    'views',
    'subscribers',
    'comments',
    'shares',
    'saves'
  ]

  const qualities = [
    { value: 'HIGH', label: 'Haute qualité', color: 'bg-green-100 text-green-800' },
    { value: 'MEDIUM', label: 'Qualité moyenne', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'BASIC', label: 'Qualité basique', color: 'bg-gray-100 text-gray-800' }
  ]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Charger les plateformes
      const platformsRes = await fetch('/api/admin/platforms')
      const platformsData = await platformsRes.json()
      setPlatforms(platformsData.platforms || [])

      // Charger les services
      const servicesRes = await fetch('/api/admin/services')
      const servicesData = await servicesRes.json()
      setServices(servicesData.services || [])
      
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const handleAddService = async () => {
    try {
      const response = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newService,
          price_usd: parseFloat(newService.price_usd),
          price_cdf: parseFloat(newService.price_cdf),
          min_quantity: parseInt(newService.min_quantity),
          max_quantity: parseInt(newService.max_quantity)
        })
      })

      if (response.ok) {
        toast.success('Service ajouté avec succès')
        setShowAddDialog(false)
        setNewService({
          platform_id: '',
          name: '',
          description: '',
          category: '',
          price_usd: '',
          price_cdf: '',
          min_quantity: '100',
          max_quantity: '10000',
          delivery_time: '0-1 heures',
          quality: 'HIGH',
          is_active: true
        })
        fetchData()
      } else {
        throw new Error('Erreur lors de la création')
      }
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du service')
    }
  }

  const handleUpdateService = async (serviceId, updates) => {
    try {
      const response = await fetch(`/api/admin/services/${serviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        toast.success('Service mis à jour')
        setShowEditDialog(false)
        setEditingService(null)
        fetchData()
      } else {
        throw new Error('Erreur lors de la mise à jour')
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const handleEditService = (service) => {
    setEditingService({
      ...service,
      price_usd: service.price_usd?.toString() || '',
      price_cdf: service.price_cdf?.toString() || '',
      min_quantity: service.min_quantity?.toString() || '',
      max_quantity: service.max_quantity?.toString() || ''
    })
    setShowEditDialog(true)
  }

  const handleSaveEdit = async () => {
    if (!editingService) return

    await handleUpdateService(editingService.id, {
      platform_id: editingService.platform_id,
      name: editingService.name,
      description: editingService.description,
      category: editingService.category,
      price_usd: parseFloat(editingService.price_usd) || 0,
      price_cdf: parseFloat(editingService.price_cdf) || 0,
      min_quantity: parseInt(editingService.min_quantity) || 1,
      max_quantity: parseInt(editingService.max_quantity) || 10000,
      delivery_time: editingService.delivery_time,
      quality: editingService.quality,
      is_active: editingService.is_active
    })
  }

  const handleDeleteService = async (serviceId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) return

    try {
      const response = await fetch(`/api/admin/services/${serviceId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Service supprimé')
        fetchData()
      } else {
        throw new Error('Erreur lors de la suppression')
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const toggleServiceStatus = async (serviceId, currentStatus) => {
    await handleUpdateService(serviceId, { is_active: !currentStatus })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gestion des Services</CardTitle>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Services</p>
                <p className="text-2xl font-bold">{services.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <ToggleRight className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Services Actifs</p>
                <p className="text-2xl font-bold text-green-600">
                  {services.filter(s => s.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Prix Moyen USD</p>
                <p className="text-2xl font-bold">
                  ${services.length > 0 ? 
                    (services.reduce((sum, s) => sum + (s.price_usd || 0), 0) / services.length).toFixed(3)
                    : '0.00'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Plateformes</p>
                <p className="text-2xl font-bold">{platforms.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Services Disponibles</CardTitle>
              <CardDescription>Gérez vos services SMM</CardDescription>
            </div>
            
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter Service
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nouveau Service</DialogTitle>
                  <DialogDescription>
                    Créez un nouveau service SMM
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="platform">Plateforme</Label>
                    <Select value={newService.platform_id} onValueChange={(value) => 
                      setNewService({...newService, platform_id: value})
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir une plateforme" />
                      </SelectTrigger>
                      <SelectContent>
                        {platforms.map(platform => (
                          <SelectItem key={platform.id} value={platform.id}>
                            {platform.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Catégorie</Label>
                    <Select value={newService.category} onValueChange={(value) => 
                      setNewService({...newService, category: value})
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat} className="capitalize">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="name">Nom du Service</Label>
                    <Input
                      value={newService.name}
                      onChange={(e) => setNewService({...newService, name: e.target.value})}
                      placeholder="Ex: Followers Instagram Premium"
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      value={newService.description}
                      onChange={(e) => setNewService({...newService, description: e.target.value})}
                      placeholder="Description détaillée du service"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price_usd">Prix USD</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={newService.price_usd}
                      onChange={(e) => setNewService({...newService, price_usd: e.target.value})}
                      placeholder="0.01"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price_cdf">Prix CDF</Label>
                    <Input
                      type="number"
                      value={newService.price_cdf}
                      onChange={(e) => setNewService({...newService, price_cdf: e.target.value})}
                      placeholder="25"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="min_quantity">Quantité Min</Label>
                    <Input
                      type="number"
                      value={newService.min_quantity}
                      onChange={(e) => setNewService({...newService, min_quantity: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_quantity">Quantité Max</Label>
                    <Input
                      type="number"
                      value={newService.max_quantity}
                      onChange={(e) => setNewService({...newService, max_quantity: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delivery_time">Délai de livraison</Label>
                    <Input
                      value={newService.delivery_time}
                      onChange={(e) => setNewService({...newService, delivery_time: e.target.value})}
                      placeholder="0-1 heures"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quality">Qualité</Label>
                    <Select value={newService.quality} onValueChange={(value) => 
                      setNewService({...newService, quality: value})
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {qualities.map(quality => (
                          <SelectItem key={quality.value} value={quality.value}>
                            {quality.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleAddService}>
                    <Save className="w-4 h-4 mr-2" />
                    Créer Service
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Dialog d'édition */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Modifier le Service</DialogTitle>
                  <DialogDescription>
                    Modifiez les informations de ce service
                  </DialogDescription>
                </DialogHeader>
                
                {editingService && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="platform">Plateforme</Label>
                      <Select 
                        value={editingService.platform_id} 
                        onValueChange={(value) => setEditingService({...editingService, platform_id: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir une plateforme" />
                        </SelectTrigger>
                        <SelectContent>
                          {platforms.map(platform => (
                            <SelectItem key={platform.id} value={platform.id}>
                              {platform.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Catégorie</Label>
                      <Select 
                        value={editingService.category} 
                        onValueChange={(value) => setEditingService({...editingService, category: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir une catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat} value={cat} className="capitalize">
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="name">Nom du Service</Label>
                      <Input
                        value={editingService.name}
                        onChange={(e) => setEditingService({...editingService, name: e.target.value})}
                        placeholder="Ex: Followers Instagram Premium"
                      />
                    </div>

                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        value={editingService.description}
                        onChange={(e) => setEditingService({...editingService, description: e.target.value})}
                        placeholder="Description détaillée du service"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price_usd">Prix USD</Label>
                      <Input
                        type="number"
                        step="0.001"
                        value={editingService.price_usd}
                        onChange={(e) => setEditingService({...editingService, price_usd: e.target.value})}
                        placeholder="0.01"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price_cdf">Prix CDF</Label>
                      <Input
                        type="number"
                        value={editingService.price_cdf}
                        onChange={(e) => setEditingService({...editingService, price_cdf: e.target.value})}
                        placeholder="25"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="min_quantity">Quantité Min</Label>
                      <Input
                        type="number"
                        value={editingService.min_quantity}
                        onChange={(e) => setEditingService({...editingService, min_quantity: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max_quantity">Quantité Max</Label>
                      <Input
                        type="number"
                        value={editingService.max_quantity}
                        onChange={(e) => setEditingService({...editingService, max_quantity: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="delivery_time">Délai de livraison</Label>
                      <Input
                        value={editingService.delivery_time}
                        onChange={(e) => setEditingService({...editingService, delivery_time: e.target.value})}
                        placeholder="0-1 heures"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quality">Qualité</Label>
                      <Select 
                        value={editingService.quality} 
                        onValueChange={(value) => setEditingService({...editingService, quality: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {qualities.map(quality => (
                            <SelectItem key={quality.value} value={quality.value}>
                              {quality.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                  <TableHead>Service</TableHead>
                  <TableHead>Plateforme</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => {
                  const platform = platforms.find(p => p.id === service.platform_id)
                  const quality = qualities.find(q => q.value === service.quality)
                  
                  return (
                    <TableRow key={service.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{service.name}</div>
                          <div className="text-sm text-gray-500 capitalize">{service.category}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {platform?.name || service.platform_id}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">${service.price_usd}</div>
                          <div className="text-xs text-gray-500">{service.price_cdf} CDF</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {service.min_quantity?.toLocaleString()} - {service.max_quantity?.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleServiceStatus(service.id, service.is_active)}
                          >
                            {service.is_active ? (
                              <ToggleRight className="w-4 h-4 text-green-600" />
                            ) : (
                              <ToggleLeft className="w-4 h-4 text-gray-400" />
                            )}
                          </Button>
                          {quality && (
                            <Badge variant="outline" className={quality.color}>
                              {quality.label}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEditService(service)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteService(service.id)}
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
        </CardContent>
      </Card>
    </div>
  )
}
