import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Card, CardContent, Button } from '../../components'
import { createTechnicalService, generateServiceNumber, getUniqueBrands } from '../../services/technical-service.service'
import { getUsers } from '../../services/users'
import { CreateTechnicalServiceDto, EquipmentType, ServicePriority, DocumentType } from '../../types/technical-service.types'
import {
  EQUIPMENT_TYPE_OPTIONS,
  PRIORITY_OPTIONS,
  DOCUMENT_TYPES,
  COMMON_BRANDS
} from '../utils/constants'
import { Wrench, Save, X, User, Package, FileText, Settings, ChevronDown, Plus, Users } from 'lucide-react'

interface BrandSelectorProps {
  value: string
  onChange: (value: string) => void
  error?: string
}

/**
 * Componente selector de marca con opciones predefinidas y entrada libre
 */
const BrandSelector = ({ value, onChange, error }: BrandSelectorProps) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const [customBrand, setCustomBrand] = useState('')
  const [isAddingCustom, setIsAddingCustom] = useState(false)

  // Obtener marcas del backend
  const { data: backendBrands = [] } = useQuery({
    queryKey: ['unique-brands'],
    queryFn: getUniqueBrands,
    staleTime: 300000 // 5 minutos
  })

  // Combinar marcas comunes y del backend
  const allBrands = Array.from(new Set([...COMMON_BRANDS, ...backendBrands])).sort()

  const handleBrandSelect = (brand: string) => {
    onChange(brand)
    setShowDropdown(false)
    setIsAddingCustom(false)
  }

  const handleAddCustomBrand = () => {
    if (customBrand.trim()) {
      onChange(customBrand.trim())
      setCustomBrand('')
      setIsAddingCustom(false)
      setShowDropdown(false)
    }
  }

  const filteredBrands = allBrands.filter(brand =>
    brand.toLowerCase().includes(value.toLowerCase())
  )

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Marca *
      </label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setShowDropdown(true)
          }}
          onFocus={() => setShowDropdown(true)}
          className={`w-full p-2 pr-8 border rounded-lg focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-500' : 'border-gray-300'
            }`}
          placeholder="Selecciona o escribe una marca"
        />
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <ChevronDown size={16} />
        </button>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {/* Marcas filtradas */}
          {filteredBrands.length > 0 && (
            <>
              {filteredBrands.slice(0, 8).map((brand) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => handleBrandSelect(brand)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                >
                  {brand}
                </button>
              ))}
            </>
          )}

          {/* Opción para agregar marca personalizada */}
          {!isAddingCustom && value && !allBrands.includes(value) && (
            <button
              type="button"
              onClick={() => setIsAddingCustom(true)}
              className="w-full text-left px-3 py-2 hover:bg-blue-50 text-blue-600 flex items-center gap-2 border-t border-gray-200"
            >
              <Plus size={16} />
              Agregar &quot;{value}&quot; como nueva marca
            </button>
          )}

          {/* Input para marca personalizada */}
          {isAddingCustom && (
            <div className="p-3 border-t border-gray-200">
              <input
                type="text"
                value={customBrand}
                onChange={(e) => setCustomBrand(e.target.value)}
                placeholder="Nueva marca"
                className="w-full p-2 border border-gray-300 rounded text-sm"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddCustomBrand()
                  }
                }}
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddCustomBrand}
                  disabled={!customBrand.trim()}
                >
                  Agregar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsAddingCustom(false)
                    setCustomBrand('')
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {filteredBrands.length === 0 && !isAddingCustom && (
            <div className="px-3 py-2 text-gray-500 text-sm">
              No se encontraron marcas. Escribe para agregar una nueva.
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowDropdown(false)}
        />
      )}

      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
      <p className="text-xs text-gray-500 mt-1">
        Selecciona una marca existente o escribe una nueva
      </p>
    </div>
  )
}

interface TechnicianSelectorProps {
  value: string
  onChange: (value: string) => void
  error?: string
}

/**
 * Selector de técnicos usando servicio de usuarios
 */
const TechnicianSelector = ({ value, onChange, error }: TechnicianSelectorProps) => {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
    staleTime: 60000 // 1 minuto
  })

  if (isLoading) {
    return (
      <div className="w-full p-2 text-sm text-gray-500 border border-gray-300 rounded-lg bg-gray-50">
        Cargando técnicos...
      </div>
    )
  }

  // Filtrar solo técnicos y empleados activos
  const technicians = users.filter(user =>
    ['SELLER', 'MANAGER', 'ADMIN'].includes(user.role) && user.active
  )

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Técnico Asignado (opcional)
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${error ? 'border-red-500' : 'border-gray-300'
          }`}
      >
        <option value="">Sin asignar</option>
        {technicians.map(user => (
          <option key={user._id} value={user._id}>
            {user.name} {user.role === 'SELLER' ? '' :
              user.role === 'MANAGER' ? '(Manager)' : '(Admin)'}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  )
}

interface CreateServiceDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onServiceCreated: () => void
}

/**
 * Dialog para crear nuevos servicios técnicos
 * Formulario completo con validaciones
 */
const CreateServiceDialog = ({ isOpen, onOpenChange, onServiceCreated }: CreateServiceDialogProps) => {
  const queryClient = useQueryClient()

  // Estado del formulario
  const [formData, setFormData] = useState<CreateTechnicalServiceDto>({
    customer: {
      name: '',
      documentType: 'DNI',
      documentNumber: '',
      phone: '',
      email: '',
      address: ''
    },
    equipment: {
      type: 'CLIPPER',
      brand: '',
      model: '',
      serialNumber: '',
      color: '',
      accessories: [],
      warrantyInfo: {
        hasWarranty: false,
        warrantyExpires: undefined,
        warrantyProvider: ''
      }
    },
    customerReport: {
      description: '',
      symptoms: [],
      whenStarted: '',
      frequency: 'SOMETIMES',
      customerNotes: ''
    },
    assignedTechnician: '',
    priority: 'NORMAL',
    estimatedDelivery: undefined,
    notes: {
      customerInstructions: '',
      technicalNotes: '',
      internalNotes: ''
    },
    generateNumber: true
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [accessories, setAccessories] = useState('')
  const [symptoms, setSymptoms] = useState('')

  // Mutación para crear servicio
  const createServiceMutation = useMutation({
    mutationFn: createTechnicalService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technical-services'] })
      onServiceCreated()
      resetForm()
    },
    onError: (error) => {
      console.error('Error creating service:', error)
    }
  })

  // Mutación para generar número
  const generateNumberMutation = useMutation({
    mutationFn: generateServiceNumber,
    onSuccess: (data) => {
      setFormData(prev => ({
        ...prev,
        serviceNumber: data.generatedNumber,
        generateNumber: false
      }))
    }
  })

  const resetForm = () => {
    setFormData({
      customer: {
        name: '',
        documentType: 'DNI',
        documentNumber: '',
        phone: '',
        email: '',
        address: ''
      },
      equipment: {
        type: 'CLIPPER',
        brand: '',
        model: '',
        serialNumber: '',
        color: '',
        accessories: [],
        warrantyInfo: {
          hasWarranty: false,
          warrantyExpires: undefined,
          warrantyProvider: ''
        }
      },
      customerReport: {
        description: '',
        symptoms: [],
        whenStarted: '',
        frequency: 'SOMETIMES',
        customerNotes: ''
      },
      assignedTechnician: '',
      priority: 'NORMAL',
      estimatedDelivery: undefined,
      notes: {
        customerInstructions: '',
        technicalNotes: '',
        internalNotes: ''
      },
      generateNumber: true
    })
    setAccessories('')
    setSymptoms('')
    setErrors({})
  }

  const updateFormData = (
    section: keyof CreateTechnicalServiceDto,
    field: string,
    value: string | boolean | number | Date | undefined
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as Record<string, unknown>),
        [field]: value
      }
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validaciones de cliente
    if (!formData.customer.name.trim()) {
      newErrors['customer.name'] = 'El nombre del cliente es requerido'
    }
    if (!formData.customer.phone.trim()) {
      newErrors['customer.phone'] = 'El teléfono del cliente es requerido'
    }

    // Validaciones de equipo
    if (!formData.equipment.brand.trim()) {
      newErrors['equipment.brand'] = 'La marca del equipo es requerida'
    }
    if (!formData.equipment.model.trim()) {
      newErrors['equipment.model'] = 'El modelo del equipo es requerido'
    }

    // Validaciones de reporte
    if (!formData.customerReport.description.trim()) {
      newErrors['customerReport.description'] = 'La descripción del problema es requerida'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    // Preparar datos finales
    const finalData = {
      ...formData,
      equipment: {
        ...formData.equipment,
        accessories: accessories.split(',').map(a => a.trim()).filter(a => a)
      },
      customerReport: {
        ...formData.customerReport,
        symptoms: symptoms.split(',').map(s => s.trim()).filter(s => s)
      }
    }

    createServiceMutation.mutate(finalData)
  }

  const handleGenerateNumber = () => {
    generateNumberMutation.mutate()
  }

  const formatDateForInput = (date: Date | undefined): string => {
    if (!date) return ''
    if (date instanceof Date) {
      return date.toISOString().split('T')[0]
    }
    return ''
  }

  const handleDateChange = (dateString: string) => {
    setFormData(prev => ({
      ...prev,
      estimatedDelivery: dateString ? new Date(dateString) : undefined
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-blue-600" />
            Crear Nuevo Servicio Técnico
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información del Cliente */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User size={20} />
                Información del Cliente
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Cliente *
                  </label>
                  <input
                    type="text"
                    value={formData.customer.name}
                    onChange={(e) => updateFormData('customer', 'name', e.target.value)}
                    className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors['customer.name'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Nombre completo del cliente"
                  />
                  {errors['customer.name'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['customer.name']}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Documento
                  </label>
                  <select
                    value={formData.customer.documentType}
                    onChange={(e) => updateFormData('customer', 'documentType', e.target.value as DocumentType)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {DOCUMENT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Documento
                  </label>
                  <input
                    type="text"
                    value={formData.customer.documentNumber}
                    onChange={(e) => updateFormData('customer', 'documentNumber', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Número de documento"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    value={formData.customer.phone}
                    onChange={(e) => updateFormData('customer', 'phone', e.target.value)}
                    className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors['customer.phone'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Teléfono de contacto"
                  />
                  {errors['customer.phone'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['customer.phone']}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.customer.email}
                    onChange={(e) => updateFormData('customer', 'email', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Email del cliente"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={formData.customer.address}
                    onChange={(e) => updateFormData('customer', 'address', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Dirección del cliente"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información del Equipo */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package size={20} />
                Información del Equipo
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Equipo *
                  </label>
                  <select
                    value={formData.equipment.type}
                    onChange={(e) => updateFormData('equipment', 'type', e.target.value as EquipmentType)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {EQUIPMENT_TYPE_OPTIONS.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <BrandSelector
                  value={formData.equipment.brand}
                  onChange={(value) => updateFormData('equipment', 'brand', value)}
                  error={errors['equipment.brand']}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Modelo *
                  </label>
                  <input
                    type="text"
                    value={formData.equipment.model}
                    onChange={(e) => updateFormData('equipment', 'model', e.target.value)}
                    className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors['equipment.model'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Modelo del equipo"
                  />
                  {errors['equipment.model'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['equipment.model']}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Serie
                  </label>
                  <input
                    type="text"
                    value={formData.equipment.serialNumber}
                    onChange={(e) => updateFormData('equipment', 'serialNumber', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Número de serie"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <input
                    type="text"
                    value={formData.equipment.color}
                    onChange={(e) => updateFormData('equipment', 'color', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Color del equipo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Accesorios (separados por comas)
                  </label>
                  <input
                    type="text"
                    value={accessories}
                    onChange={(e) => setAccessories(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Cable, cargador, estuche..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Problema Reportado */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText size={20} />
                Problema Reportado
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción del Problema *
                  </label>
                  <textarea
                    value={formData.customerReport.description}
                    onChange={(e) => updateFormData('customerReport', 'description', e.target.value)}
                    className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors['customerReport.description'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    rows={3}
                    placeholder="Describe el problema reportado por el cliente..."
                  />
                  {errors['customerReport.description'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['customerReport.description']}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Síntomas (separados por comas)
                  </label>
                  <input
                    type="text"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="No enciende, hace ruido, vibra..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ¿Cuándo comenzó?
                    </label>
                    <input
                      type="text"
                      value={formData.customerReport.whenStarted}
                      onChange={(e) => updateFormData('customerReport', 'whenStarted', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Hace una semana, ayer..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frecuencia
                    </label>
                    <select
                      value={formData.customerReport.frequency}
                      onChange={(e) => updateFormData('customerReport', 'frequency', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ALWAYS">Siempre</option>
                      <option value="SOMETIMES">A veces</option>
                      <option value="RARELY">Rara vez</option>
                      <option value="ONCE">Una vez</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas del Cliente
                  </label>
                  <textarea
                    value={formData.customerReport.customerNotes}
                    onChange={(e) => updateFormData('customerReport', 'customerNotes', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Información adicional del cliente..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuración del Servicio */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Settings size={20} />
                Configuración del Servicio
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prioridad
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as ServicePriority }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {PRIORITY_OPTIONS.map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entrega Estimada
                  </label>
                  <input
                    type="date"
                    value={formatDateForInput(formData.estimatedDelivery)}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <TechnicianSelector
                    value={formData.assignedTechnician || ''}
                    onChange={(value) => setFormData(prev => ({ ...prev, assignedTechnician: value || undefined }))}
                  />
                </div>

                <div className="md:col-span-2 flex items-center">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.generateNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, generateNumber: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">Generar número automático</span>
                    </label>

                    {!formData.generateNumber && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateNumber}
                        disabled={generateNumberMutation.isPending}
                      >
                        Generar
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {formData.serviceNumber && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Número generado:</strong> {formData.serviceNumber}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createServiceMutation.isPending}
            >
              <X size={16} className="mr-2" />
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={createServiceMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save size={16} className="mr-2" />
              {createServiceMutation.isPending ? 'Creando...' : 'Crear Servicio'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateServiceDialog