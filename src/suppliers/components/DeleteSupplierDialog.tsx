import { useState, useEffect } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Label,
  Loader,
  RadioGroup,
  RadioGroupItem
} from '../../components'
import { ComboboxSuppliers } from '../../components/ui/combobox-suppliers'
import { toast } from 'react-toastify'
import { AxiosError } from 'axios'
import { deleteSupplier } from '../../services/suppliers'
import { findProductsBySupplier } from '../../services/index'
import { Supplier } from '../../types/inventory.types'

interface DeleteSupplierDialogProps {
  supplier: Supplier | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSupplierDeleted: () => void
}

type DeleteOption = 'transfer' | 'force' | 'cancel'

const DeleteSupplierDialog = ({
  supplier,
  isOpen,
  onOpenChange,
  onSupplierDeleted
}: DeleteSupplierDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [hasProducts, setHasProducts] = useState(false)
  const [productCount, setProductCount] = useState(0)
  const [deleteOption, setDeleteOption] = useState<DeleteOption>('transfer')
  const [transferToSupplierId, setTransferToSupplierId] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  // Verificar si el proveedor tiene productos cuando se abre el diálogo
  useEffect(() => {
    const checkProducts = async () => {
      if (!supplier?._id || !isOpen) return

      try {
        setIsChecking(true)
        setError(null)

        // Buscar productos asociados al proveedor
        const response = await findProductsBySupplier(supplier._id, {
          pageSize: 1 // Solo necesitamos saber si hay al menos un producto
        })

        const count = response.meta?.total || 0
        setHasProducts(count > 0)
        setProductCount(count)

        // Resetear estados cuando se abre el diálogo
        setTransferToSupplierId('')
        setDeleteOption('transfer')
      } catch (error) {
        console.error('Error al verificar productos:', error)
        setError('No se pudieron verificar los productos asociados')
      } finally {
        setIsChecking(false)
      }
    }

    if (isOpen) {
      checkProducts()
    }
  }, [supplier, isOpen])

  const validateForm = () => {
    if (hasProducts) {
      if (deleteOption === 'transfer' && !transferToSupplierId) {
        setError('Debe seleccionar un proveedor alternativo para los productos')
        return false
      }

      // No transferir al mismo proveedor
      if (
        deleteOption === 'transfer' &&
        transferToSupplierId === supplier?._id
      ) {
        setError('No puede seleccionar el mismo proveedor')
        return false
      }
    }

    setError(null)
    return true
  }

  const handleDelete = async () => {
    if (!supplier?._id) return

    if (!validateForm()) return

    try {
      setIsDeleting(true)

      // Preparar el payload según la opción seleccionada
      const payload = hasProducts
        ? deleteOption === 'transfer'
          ? { transferToSupplierId }
          : deleteOption === 'force'
            ? { forceDelete: true }
            : undefined
        : undefined

      await deleteSupplier(supplier._id, payload)

      let successMessage = 'Proveedor eliminado exitosamente'

      if (hasProducts) {
        if (deleteOption === 'transfer') {
          successMessage = `Proveedor eliminado y ${productCount} productos transferidos exitosamente`
        } else if (deleteOption === 'force') {
          successMessage = `Proveedor eliminado junto con ${productCount} productos asociados`
        }
      }

      toast.success(successMessage)
      onSupplierDeleted()
      onOpenChange(false)
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage =
          error.response?.data?.details ||
          error.response?.data?.error ||
          error.response?.data?.message ||
          'Error al eliminar el proveedor'

        setError(errorMessage)
        toast.error(errorMessage)
      } else {
        setError('Error al eliminar el proveedor')
        toast.error('Error al eliminar el proveedor')
      }
      console.error(error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className='w-[95vw] max-w-md sm:max-w-lg'>
        <AlertDialogHeader>
          <AlertDialogTitle className='text-lg sm:text-xl'>¿Estás seguro?</AlertDialogTitle>
          <div className='space-y-3 sm:space-y-4 text-sm text-muted-foreground'>
            {isChecking ? (
              <div className='flex items-center justify-center py-4'>
                <Loader className='mr-2' /> <span className='text-xs sm:text-sm'>Verificando productos asociados...</span>
              </div>
            ) : (
              <>
                <div className='text-xs sm:text-sm'>
                  Esta acción eliminará permanentemente al proveedor{' '}
                  <span className='font-medium'>{supplier?.name}</span>.
                </div>

                {hasProducts && (
                  <div className='border rounded-md p-3 sm:p-4 bg-amber-50 text-amber-800'>
                    <div className='font-medium text-sm sm:text-base'>¡Atención!</div>
                    <div className='mb-3 text-xs sm:text-sm'>
                      Este proveedor tiene {productCount} productos asociados.
                      Por favor seleccione qué hacer con estos productos:
                    </div>

                    <RadioGroup
                      value={deleteOption}
                      onValueChange={(value) =>
                        setDeleteOption(value as DeleteOption)
                      }
                      className='space-y-3'
                    >
                      <div className='flex items-start space-x-2'>
                        <RadioGroupItem value='transfer' id='transfer' />
                        <div className='grid gap-1.5 leading-none'>
                          <Label htmlFor='transfer' className='font-medium text-xs sm:text-sm'>
                            Transferir productos a otro proveedor
                          </Label>
                          {deleteOption === 'transfer' && (
                            <div className='mt-2 pl-2'>
                              <ComboboxSuppliers
                                value={transferToSupplierId}
                                onChange={setTransferToSupplierId}
                                excludeIds={[supplier?._id || '']}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className='flex items-start space-x-2'>
                        <RadioGroupItem value='force' id='force' />
                        <div className='grid gap-1.5 leading-none'>
                          <Label htmlFor='force' className='font-medium text-xs sm:text-sm'>
                            Eliminar proveedor y todos sus productos
                          </Label>
                          {deleteOption === 'force' && (
                            <div className='text-xs text-red-600 pl-2'>
                              ¡Advertencia! Esta acción eliminará
                              permanentemente todos los productos asociados a
                              este proveedor.
                            </div>
                          )}
                        </div>
                      </div>

                      <div className='flex items-start space-x-2'>
                        <RadioGroupItem value='cancel' id='cancel' />
                        <div className='grid gap-1.5 leading-none'>
                          <Label htmlFor='cancel' className='font-medium text-xs sm:text-sm'>
                            Cancelar y volver
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {error && (
                  <div className='border rounded-md p-2 bg-red-50 text-red-800 text-xs sm:text-sm'>
                    {error}
                  </div>
                )}
              </>
            )}
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter className='flex flex-col sm:flex-row gap-2 sm:gap-0 sm:space-x-2'>
          <AlertDialogCancel className='w-full sm:w-auto h-9 sm:h-10'>Cancelar</AlertDialogCancel>
          {!isChecking && deleteOption !== 'cancel' && (
            <AlertDialogAction
              onClick={handleDelete}
              className={`w-full sm:w-auto h-9 sm:h-10 ${deleteOption === 'force'
                ? 'bg-red-700 hover:bg-red-800'
                : 'bg-red-600 hover:bg-red-700'
                }`}
              disabled={isDeleting}
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default DeleteSupplierDialog
