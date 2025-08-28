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
      {/* Header Admin */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Settings className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
                  <p className="text-sm text-gray-500">Panneau de contrôle OKIT Boost</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-400" />
                <div className="text-right">
                  <div className="text-sm font-medium">{profile?.full_name || user?.email?.split('@')[0]}</div>
                  <div className="text-xs text-gray-500">Administrateur</div>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/')}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Retour au site
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Tableau de bord</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center space-x-2">
              <ShoppingCart className="w-4 h-4" />
              <span>Commandes</span>
            </TabsTrigger>
            <TabsTrigger value="trials" className="flex items-center space-x-2">
              <TestTube className="w-4 h-4" />
              <span>Essais</span>
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center space-x-2">
              <Package className="w-4 h-4" />
              <span>Services</span>
            </TabsTrigger>
            <TabsTrigger value="platforms" className="flex items-center space-x-2">
              <Monitor className="w-4 h-4" />
              <span>Plateformes</span>
            </TabsTrigger>
          </TabsList>

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
