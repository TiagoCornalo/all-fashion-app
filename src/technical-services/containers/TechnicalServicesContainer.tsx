import { useState, lazy, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { LayoutMultiRole } from '../../layout'
import {
  Wrench,
  FileText,
  BarChart3,
  File
} from 'lucide-react'

// Lazy load de componentes para mejor performance
const ServicesList = lazy(() => import('../components/ServicesList'))
const ServiceDashboard = lazy(() => import('../components/ServiceDashboard'))
const TemplatesContainer = lazy(() => import('./TemplatesContainer'))
const CreateServiceDialog = lazy(() => import('../components/CreateServiceDialog'))

/**
 * Contenedor principal para gestión de servicios técnicos
 * Incluye dashboard, lista de servicios, templates y configuración
 */
const TechnicalServicesContainer = () => {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

  return (
    <LayoutMultiRole allowedRoles={['ADMIN', 'MANAGER', 'SELLER']}>
      <div className="p-2 sm:p-4 lg:p-6">
        <Card className="w-full">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 p-3 sm:p-4 lg:p-6">
            <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-center sm:text-left">
              <Wrench className="h-5 w-5 sm:h-6 sm:w-6 mx-auto sm:mx-0 text-blue-600" />
              <span className="text-lg sm:text-xl lg:text-2xl">Servicios Técnicos</span>
            </CardTitle>
            <p className="text-sm text-gray-600 text-center sm:text-left mt-1 sm:mt-0">
              Gestión completa de servicios técnicos y reparaciones
            </p>
          </CardHeader>

          <CardContent className="p-3 sm:p-4 lg:p-6">
            {/* Navegación por tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto p-1">
                <TabsTrigger
                  value="dashboard"
                  className="flex items-center gap-2 px-4 py-2"
                >
                  <BarChart3 size={16} />
                  <span className="hidden sm:inline">Dashboard</span>
                </TabsTrigger>

                <TabsTrigger
                  value="services"
                  className="flex items-center gap-2 px-4 py-2"
                >
                  <Wrench size={16} />
                  <span className="hidden sm:inline">Servicios</span>
                </TabsTrigger>

                <TabsTrigger
                  value="templates"
                  className="flex items-center gap-2 px-4 py-2"
                >
                  <File size={16} />
                  <span className="hidden sm:inline">Templates</span>
                </TabsTrigger>

                <TabsTrigger
                  value="reports"
                  className="flex items-center gap-2 px-4 py-2"
                >
                  <FileText size={16} />
                  <span className="hidden sm:inline">Reportes</span>
                </TabsTrigger>
              </TabsList>

              {/* Dashboard */}
              <TabsContent value="dashboard" className="space-y-6">
                <Suspense fallback={
                  <Card>
                    <CardContent className="p-6">
                      <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                }>
                  <ServiceDashboard />
                </Suspense>
              </TabsContent>

              {/* Lista de servicios */}
              <TabsContent value="services" className="space-y-6">
                <Suspense fallback={
                  <Card>
                    <CardContent className="p-6">
                      <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="h-48 bg-gray-200 rounded"></div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                }>
                  <ServicesList />
                </Suspense>
              </TabsContent>

              {/* Templates de servicios */}
              <TabsContent value="templates" className="space-y-6">
                <Suspense fallback={
                  <Card>
                    <CardContent className="p-6">
                      <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="h-32 bg-gray-200 rounded"></div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                }>
                  <TemplatesContainer />
                </Suspense>
              </TabsContent>

              {/* Reportes */}
              <TabsContent value="reports" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Reportes y Análisis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Próximamente
                      </h3>
                      <p className="text-gray-600 max-w-sm mx-auto">
                        Los reportes y análisis avanzados estarán disponibles pronto.
                        Podrás generar reportes de productividad, costos y más.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs globales */}
      <Suspense fallback={null}>
        {showCreateDialog && (
          <CreateServiceDialog
            isOpen={showCreateDialog}
            onOpenChange={setShowCreateDialog}
            onServiceCreated={() => {
              setShowCreateDialog(false)
              // Refrescar datos si es necesario
            }}
          />
        )}
      </Suspense>
    </LayoutMultiRole>
  )
}

export default TechnicalServicesContainer