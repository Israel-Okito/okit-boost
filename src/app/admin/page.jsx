"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/hooks/useAuth"
import { useRouter } from "next/navigation"
import Dashboard from "@/components/admin/Dashboard"
import ServicesManager from "@/components/admin/ServicesManager"
import PlatformsManager from "@/components/admin/PlatformsManager"
import OrdersManager from "@/components/admin/OrdersManager"
import TrialsManager from "@/components/admin/TrialsManager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { 
  BarChart3,
  Package, 
  Monitor,
  ShoppingCart,
  Shield,
  Settings,
  LogOut,
  User,
  TestTube
} from "lucide-react"
import { toast } from "sonner"

export default function AdminPanel() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('dashboard')

  // Vérification des droits d'admin
  useEffect(() => {
    if (!user) {
      router.push('/connexion')
      return
    }
    
    // Vérifier si l'utilisateur est admin
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
      {/* Header Admin - Responsive */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <Settings className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                        <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Administration</h1>
                  <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Panneau de contrôle OKIT Boost</p>
                          </div>
                          </div>
                        </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <div className="text-left sm:text-right">
                  <div className="text-sm font-medium truncate max-w-32 sm:max-w-none">
                    {profile?.full_name || user?.email?.split('@')[0]}
                          </div>
                  <div className="text-xs text-gray-500">Administrateur</div>
                        </div>
                      </div>

                          <Button
                            variant="outline"
                            size="sm"
                onClick={() => router.push('/')}
                className="w-full sm:w-auto"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span className="sm:hidden">Retour</span>
                <span className="hidden sm:inline">Retour au site</span>
                </Button>
              </div>
                          </div>
                        </div>
                      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          {/* Version Desktop des Tabs */}
          <TabsList className="hidden lg:grid lg:grid-cols-5 lg:w-auto">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2 text-sm">
              <BarChart3 className="w-4 h-4" />
              <span>Tableau de bord</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center space-x-2 text-sm">
              <ShoppingCart className="w-4 h-4" />
              <span>Commandes</span>
            </TabsTrigger>
            <TabsTrigger value="trials" className="flex items-center space-x-2 text-sm">
              <TestTube className="w-4 h-4" />
              <span>Essais</span>
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center space-x-2 text-sm">
              <Package className="w-4 h-4" />
              <span>Services</span>
            </TabsTrigger>
            <TabsTrigger value="platforms" className="flex items-center space-x-2 text-sm">
              <Monitor className="w-4 h-4" />
              <span>Plateformes</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Version Mobile - Menu horizontal scrollable */}
          <div className="lg:hidden">
            <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                          <Button
                variant={activeTab === 'dashboard' ? 'default' : 'outline'}
                            size="sm"
                onClick={() => setActiveTab('dashboard')}
                className="whitespace-nowrap flex items-center space-x-1"
              >
                <BarChart3 className="w-3 h-3" />
                <span className="text-xs">Tableau</span>
                          </Button>
                              <Button
                variant={activeTab === 'orders' ? 'default' : 'outline'}
                                size="sm"
                onClick={() => setActiveTab('orders')}
                className="whitespace-nowrap flex items-center space-x-1"
              >
                <ShoppingCart className="w-3 h-3" />
                <span className="text-xs">Commandes</span>
                              </Button>
                              <Button
                variant={activeTab === 'trials' ? 'default' : 'outline'}
                                size="sm"
                onClick={() => setActiveTab('trials')}
                className="whitespace-nowrap flex items-center space-x-1"
              >
                <TestTube className="w-3 h-3" />
                <span className="text-xs">Essais</span>
                              </Button>
                            <Button
                variant={activeTab === 'services' ? 'default' : 'outline'}
                              size="sm"
                onClick={() => setActiveTab('services')}
                className="whitespace-nowrap flex items-center space-x-1"
              >
                <Package className="w-3 h-3" />
                <span className="text-xs">Services</span>
                            </Button>
              <Button
                variant={activeTab === 'platforms' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('platforms')}
                className="whitespace-nowrap flex items-center space-x-1"
              >
                <Monitor className="w-3 h-3" />
                <span className="text-xs">Plateformes</span>
                </Button>
              </div>
              </div>

          <TabsContent value="dashboard" className="space-y-6">
            <Dashboard />
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <OrdersManager />
          </TabsContent>

          <TabsContent value="trials" className="space-y-6">
            <TrialsManager />
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <ServicesManager />
          </TabsContent>

          <TabsContent value="platforms" className="space-y-6">
            <PlatformsManager />
          </TabsContent>
        </Tabs>
                    </div>
                  </div>
  )
}
