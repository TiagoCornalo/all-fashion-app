import { useState, useEffect } from 'react'
import { useInventory } from '../../../context/InventoryContext'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button
} from '../../../../components'
import { Product } from '../../../../types/inventory.types'
import { formatCurrency } from '../../../../utils'
import { editProduct } from '../../../../services'

interface EditProductDialogProps {
  product: Product | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

const EditProductDialog = ({
  product,
  isOpen,
  onOpenChange
}: EditProductDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<Product | null>(null)
  const { refreshTable } = useInventory()

  useEffect(() => {
    if (product) {
      setFormData(product)
    }
  }, [product])

  const handleSubmit = async () => {
    if (!formData) return

    try {
      setIsSubmitting(true)
      await editProduct(formData)
      onOpenChange(false)
      window.dispatchEvent(new CustomEvent('productUpdated'))
    } catch (error) {
      console.error('Error al actualizar el producto:', error)
    } finally {
      refreshTable()
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>Editar Producto</DialogTitle>
          <DialogDescription>
            Editar información del producto {product?.name}
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          {formData && (
            <>
              <p>
                <strong>Código:</strong> {formData.code}
              </p>
              <p>
                <strong>Nombre:</strong> {formData.name}
              </p>
              <p>
                <strong>Stock Actual:</strong> {formData.stock}
              </p>
              <p>
                <strong>Precio:</strong> {formatCurrency(formData.price)}
              </p>
              <p>
                <strong>Proveedor:</strong> {formData.supplier.name}
              </p>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default EditProductDialog
