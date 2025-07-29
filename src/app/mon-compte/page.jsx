"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Package, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react"

export default function AccountPage() {
  const [orders] = useState([
    {
      id: "ORD-001",
      service: "Vues TikTok Instantané",
      platform: "TikTok",
      quantity: 1000,
      price: 25000,
      currency: "CDF",
      status: "completed",
      created_at: "2024-01-15T10:30:00Z",
      target_link: "https://tiktok.com/@username/video/123",
    },
    {
      id: "ORD-002",
      service: "Followers Instagram Premium",
      platform: "Instagram",
      quantity: 500,
      price: 100000,
      currency: "CDF",
      status: "processing",
      created_at: "2024-01-14T14:20:00Z",
      target_link: "https://instagram.com/username",
    },
    {
      id: "ORD-003",
      service: "Likes YouTube",
      platform: "YouTube",
      quantity: 200,
      price: 12500,
      currency: "CDF",
      status: "pending",
      created_at: "2024-01-13T09:15:00Z",
      target_link: "https://youtube.com/watch?v=abc123",
    },
  ])

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
      default:
        return "bg-gray-100 text-gray-800"
    }
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
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="text-sm font-medium text-gray-900">{order.id}</div>
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
                        <div className="text-sm font-medium text-gray-900 mb-1">{order.service}</div>
                        <div className="text-sm text-gray-600">Plateforme: {order.platform}</div>
                        <div className="text-sm text-gray-600">Quantité: {order.quantity.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {order.price.toLocaleString()} {order.currency}
                        </div>
                        <div className="text-sm text-gray-600 truncate">{order.target_link}</div>
                      </div>
                    </div>

                    <div className="mt-4 flex space-x-2">
                      <Button variant="outline" size="sm">
                        Voir détails
                      </Button>
                      {order.status === "completed" && (
                        <Button variant="outline" size="sm">
                          Recommander
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Informations personnelles
              </CardTitle>
              <CardDescription>Modifiez vos informations de compte</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      defaultValue="Jean Dupont"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      defaultValue="jean.dupont@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue="+243 XXX XXX XXX"
                  />
                </div>
                <Button>Mettre à jour</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Commandes totales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{orders.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Montant total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {orders.reduce((sum, order) => sum + order.price, 0).toLocaleString()} CDF
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Commandes terminées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {orders.filter((order) => order.status === "completed").length}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
