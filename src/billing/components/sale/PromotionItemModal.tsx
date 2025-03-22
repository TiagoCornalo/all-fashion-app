import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage
} from '../../../components'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import api from '../../../services/config/axios'
import { toast } from 'react-toastify'

const formSchema = z.object({
  promotionCode: z.string().min(1, 'El código de promoción es requerido')
})

interface PromotionItemModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  itemIndex: number
  itemName: string
  onApplyPromotion: (index: number, code: string) => void
}

const PromotionItemModal = ({
  isOpen,
  onOpenChange,
  itemIndex,
  itemName,
  onApplyPromotion
}: PromotionItemModalProps) => {
  const [validating, setValidating] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      promotionCode: ''
    }
  })

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setValidating(true)
      // Verificar que el código de promoción sea válido
      const response = await api.get(
        `/promotions/validate/${values.promotionCode}`
      )

      if (response.data.valid) {
        onApplyPromotion(itemIndex, values.promotionCode)
        onOpenChange(false)
        form.reset()

        // Mostrar el porcentaje de descuento en el mensaje
        const discountPercentage =
          response.data.promotion?.discountPercentage || 0
        toast.success(`Promoción aplicada: ${discountPercentage}% de descuento`)
      } else {
        toast.error('Código de promoción inválido')
      }
    } catch (error) {
      console.error('Error al validar código de promoción:', error)
      toast.error('Error al validar código de promoción')
    } finally {
      setValidating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Aplicar promoción a: {itemName}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='promotionCode'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder='Ingrese código de promoción'
                      {...field}
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='flex justify-end space-x-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
                disabled={validating}
              >
                Cancelar
              </Button>
              <Button
                type='submit'
                disabled={!form.formState.isValid || validating}
              >
                {validating ? 'Validando...' : 'Aplicar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default PromotionItemModal
