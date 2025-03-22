import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl
} from '../../../components'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { PaymentType } from '../../../types/sale.types'
import { Checkbox } from '../../../components'
import { useSaleForm } from '../hooks/useSaleForm'
import { useEffect } from 'react'
import { useSaleStore } from '../../../stores/saleStore'

const formSchema = z.object({
  selectedMethods: z.array(z.enum(['CASH', 'DEBIT', 'CREDIT', 'TRANSFER'])),
  amounts: z.record(z.number().min(0))
})

type FormValues = z.infer<typeof formSchema>

const PaymentForm = () => {
  const {
    total,
    remaining,
    selectedMethods,
    setSelectedMethods,
    paymentAmounts,
    updatePaymentAmount
  } = useSaleForm()

  const { discount, combos, items, itemPromotions } = useSaleStore()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      selectedMethods: [],
      amounts: paymentAmounts
    }
  })

  const handleAmountChange = (method: string, value: number) => {
    form.setValue(`amounts.${method}`, value)
    updatePaymentAmount(method as PaymentType, value || 0)
  }

  useEffect(() => {
    if (selectedMethods.length === 1) {
      handleAmountChange(selectedMethods[0], parseFloat(total.toFixed(2)))
    }
  }, [selectedMethods.length, total])

  const onMethodChange = (method: PaymentType, checked: boolean) => {
    const updated = checked
      ? [...selectedMethods, method]
      : selectedMethods.filter((m) => m !== method)

    form.setValue('selectedMethods', updated)
    setSelectedMethods(updated)

    if (!checked) {
      handleAmountChange(method, 0)
    } else if (updated.length === 1) {
      handleAmountChange(method, parseFloat(total.toFixed(2)))
    }
  }

  useEffect(() => {
    form.setValue('amounts', paymentAmounts)
  }, [paymentAmounts])

  return (
    <div className='flex flex-col h-full'>
      <Card>
        <CardHeader>
          <CardTitle>
            Total a pagar: ${total.toFixed(2)}
            {discount > 0 && (
              <span className='ml-2 text-sm text-green-600'>
                (Descuento aplicado: {discount}%)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(combos.length > 0 || discount > 0 || itemPromotions.length > 0) && (
            <div className='mb-4 p-3 bg-gray-50 rounded-md'>
              <h3 className='text-sm font-medium mb-2'>Desglose</h3>
              <div className='space-y-1 text-sm'>
                {/* Subtotal de productos antes de descuento */}
                {items.length > 0 && (
                  <div className='flex justify-between'>
                    <span>Subtotal productos:</span>
                    <span>
                      $
                      {items
                        .reduce(
                          (sum, item) =>
                            sum +
                            (item.originalPrice || item.price) * item.quantity,
                          0
                        )
                        .toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Descuento global si aplica */}
                {discount > 0 && (
                  <div className='flex justify-between text-green-600'>
                    <span>Descuento global ({discount}%):</span>
                    <span>
                      -$
                      {items
                        .reduce(
                          (sum, item) => sum + (item.discountAmount || 0),
                          0
                        )
                        .toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Subtotal de productos después de descuento */}
                {items.length > 0 && (
                  <div className='flex justify-between'>
                    <span>Subtotal productos (con descuento):</span>
                    <span>
                      $
                      {items
                        .reduce(
                          (sum, item) =>
                            sum + (item.subtotal || item.price * item.quantity),
                          0
                        )
                        .toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Subtotal de combos */}
                {combos.length > 0 && (
                  <div className='flex justify-between'>
                    <span>Subtotal combos:</span>
                    <span>
                      $
                      {combos
                        .reduce(
                          (sum, combo) =>
                            sum + (combo.price || 0) * combo.quantity,
                          0
                        )
                        .toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Total */}
                <div className='border-t pt-1 mt-1 font-medium flex justify-between'>
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <Form {...form}>
            <div className='space-y-6'>
              {/* Métodos de pago en grid */}
              <FormField
                control={form.control}
                name='selectedMethods'
                render={() => (
                  <FormItem>
                    <FormLabel>Métodos de pago</FormLabel>
                    <FormControl>
                      <div className='grid grid-cols-2 gap-4'>
                        {[
                          { value: 'CASH', label: 'Efectivo' },
                          { value: 'DEBIT', label: 'Débito' },
                          { value: 'CREDIT', label: 'Crédito' },
                          { value: 'TRANSFER', label: 'Transferencia' }
                        ].map((method) => (
                          <div
                            key={method.value}
                            className='flex items-center space-x-2'
                          >
                            <Checkbox
                              checked={selectedMethods.includes(
                                method.value as PaymentType
                              )}
                              onCheckedChange={(checked) => {
                                onMethodChange(
                                  method.value as PaymentType,
                                  checked as boolean
                                )
                              }}
                            />
                            <span>{method.label}</span>
                          </div>
                        ))}
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Inputs de montos en grid cuando hay muchos métodos */}
              {selectedMethods.length > 0 && (
                <div
                  className={`grid ${
                    selectedMethods.length > 2 ? 'grid-cols-2' : 'grid-cols-1'
                  } gap-4`}
                >
                  {selectedMethods.map((method) => (
                    <FormField
                      key={method}
                      control={form.control}
                      name={`amounts.${method}`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {method === 'CASH'
                              ? 'Efectivo'
                              : method === 'DEBIT'
                              ? 'Débito'
                              : method === 'CREDIT'
                              ? 'Crédito'
                              : 'Transferencia'}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => {
                                const value =
                                  e.target.value === ''
                                    ? ''
                                    : Number(e.target.value)
                                handleAmountChange(method, value || 0)
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              )}

              <div className='text-lg font-medium'>Restante: ${remaining}</div>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

export default PaymentForm
