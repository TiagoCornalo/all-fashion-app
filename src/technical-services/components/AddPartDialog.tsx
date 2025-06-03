import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Button } from '../../components'
import { addPartToService } from '../../services/technical-service.service'
import { searchProducts } from '../../services/product.service'
import { Product } from '../../types/product.types'
import { AddPartDto } from '../../types/technical-service.types'
import { formatCurrency } from '../../utils'
import {
  Search,
  Package,
  Plus,
  X,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface AddPartDialogProps {
  serviceId: string | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onPartAdded?: () => void
}

/**
 * Dialog para agregar piezas a servicios técnicos
 * Permite buscar productos del inventario y agregarlos como piezas
 */
const AddPartDialog = ({ serviceId, isOpen, onOpenChange, onPartAdded }: AddPartDialogProps) => {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [unitPrice, setUnitPrice] = useState(0)
  const [notes, setNotes] = useState('')
  const [showProductList, setShowProductList] = useState(false)

  // Buscar productos cuando hay término de búsqueda
  const { data: products = [], isLoading: isSearching } = useQuery({
    queryKey: ['search-products', searchTerm],
    queryFn: () => searchProducts(searchTerm),
    enabled: searchTerm.length >= 2,
    staleTime: 30000
  })

  // Mutación para agregar pieza
  const addPartMutation = useMutation({
    mutationFn: (data: { serviceId: string; partData: AddPartDto }) =>
      addPartToService(data.serviceId, data.partData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technical-service', serviceId] })
      queryClient.invalidateQueries({ queryKey: ['technical-services'] })
      onPartAdded?.()
      resetForm()
      onOpenChange(false)
    }
  })

  const resetForm = () => {
    setSearchTerm('')
    setSelectedProduct(null)
    setQuantity(1)
    setUnitPrice(0)
    setNotes('')
    setShowProductList(false)
  }

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product)
    setSearchTerm(product.name)
    setUnitPrice(product.price)
    setShowProductList(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!serviceId || !selectedProduct) return

    const partData: AddPartDto = {
      productId: selectedProduct._id,
      quantity,
      unitPrice,
      notes: notes.trim() || undefined
    }

    addPartMutation.mutate({ serviceId, partData })
  }

  const subtotal = quantity * unitPrice
  const isFormValid = selectedProduct && quantity > 0 && unitPrice >= 0

  // Efecto para mostrar/ocultar lista de productos
  useEffect(() => {
    if (searchTerm.length >= 2 && products.length > 0) {
      setShowProductList(true)
    } else {
      setShowProductList(false)
    }
  }, [searchTerm, products])

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      resetForm()
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Agregar Pieza al Servicio
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Búsqueda de producto */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Buscar Producto *
            </label>
            <div className="relative">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setSelectedProduct(null)
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Buscar por nombre, código o descripción..."
                  required
                />
              </div>

              {/* Lista de productos encontrados */}
              {showProductList && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-gray-500">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      Buscando productos...
                    </div>
                  ) : products.length > 0 ? (
                    products.map((product) => (
                      <button
                        key={product._id}
                        type="button"
                        onClick={() => handleProductSelect(product)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {product.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              Código: {product.code}
                            </p>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-sm text-green-600 font-medium">
                                {formatCurrency(product.price)}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full ${product.stock > 0
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                                }`}>
                                Stock: {product.stock}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      No se encontraron productos
                    </div>
                  )}
                </div>
              )}

              {/* Click outside to close */}
              {showProductList && (
                <div
                  className="fixed inset-0 z-5"
                  onClick={() => setShowProductList(false)}
                />
              )}
            </div>

            {searchTerm.length >= 2 && searchTerm.length < 3 && (
              <p className="text-xs text-gray-500">
                Escriba al menos 2 caracteres para buscar
              </p>
            )}
          </div>

          {/* Información del producto seleccionado */}
          {selectedProduct && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-blue-600 mt-1" />
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900">{selectedProduct.name}</h4>
                  <p className="text-sm text-blue-700">Código: {selectedProduct.code}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm text-blue-700">
                      Precio sugerido: {formatCurrency(selectedProduct.price)}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${selectedProduct.stock > 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                      }`}>
                      Stock disponible: {selectedProduct.stock}
                    </span>
                  </div>
                  {selectedProduct.stock === 0 && (
                    <div className="flex items-center gap-2 mt-2 text-amber-700">
                      <AlertTriangle size={16} />
                      <span className="text-xs">
                        Producto sin stock. Se registrará pero verificar disponibilidad.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Cantidad y precio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad *
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                required
              />
              {selectedProduct && quantity > selectedProduct.stock && selectedProduct.stock > 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  ⚠️ Cantidad mayor al stock disponible ({selectedProduct.stock})
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio Unitario *
              </label>
              <input
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          {/* Subtotal */}
          {isFormValid && (
            <div className="p-3 bg-gray-50 rounded-lg border">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Subtotal:</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(subtotal)}
                </span>
              </div>
            </div>
          )}

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Notas sobre el uso de esta pieza..."
            />
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={addPartMutation.isPending}
            >
              <X size={16} className="mr-2" />
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={!isFormValid || addPartMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {addPartMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Plus size={16} className="mr-2" />
              )}
              {addPartMutation.isPending ? 'Agregando...' : 'Agregar Pieza'}
            </Button>
          </div>

          {/* Estado de éxito/error */}
          {addPartMutation.isError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
              <AlertTriangle size={16} />
              <span className="text-sm">
                Error al agregar la pieza. Intente nuevamente.
              </span>
            </div>
          )}

          {addPartMutation.isSuccess && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
              <CheckCircle size={16} />
              <span className="text-sm">
                Pieza agregada exitosamente
              </span>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddPartDialog