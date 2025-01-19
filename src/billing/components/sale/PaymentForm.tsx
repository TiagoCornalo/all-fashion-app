import { useEffect } from 'react'
import { useSaleStore } from '../../../stores/saleStore'
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
import { Payment, PaymentType } from '../../../types/sale.types'
import { Checkbox } from '../../../components'

interface PaymentFormProps {
  total: number
  onComplete: () => void
  remaining: number
  setRemaining: (value: number) => void
}

const formSchema = z.object({
  selectedMethods: z.array(z.enum(['CASH', 'DEBIT', 'CREDIT', 'TRANSFER'])),
  amounts: z.record(z.number().min(0))
})

type FormValues = z.infer<typeof formSchema>

const PaymentForm = ({
  total,
  onComplete,
  remaining,
  setRemaining
}: PaymentFormProps) => {
  const { setPayments } = useSaleStore()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      selectedMethods: [],
      amounts: {}
    }
  })

  const selectedMethods = form.watch('selectedMethods')

  useEffect(() => {
    if (selectedMethods.length === 1) {
      form.setValue(`amounts.${selectedMethods[0]}`, total)
      setRemaining(0)
    } else {
      form.setValue('amounts', {})
      setRemaining(total)
    }
  }, [selectedMethods, total])

  const handleSubmit = (values: FormValues) => {
    const payments: Payment[] = values.selectedMethods.map((method) => ({
      type: method,
      amount: values.amounts[method] || 0
    }))
    setPayments(payments)
    onComplete()
  }

  const calculateRemaining = (values: Record<string, number>) => {
    const totalPaid = Object.values(values).reduce(
      (sum, amount) => sum + (amount || 0),
      0
    )
    return total - totalPaid
  }

  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader>
          <CardTitle>Total a pagar: ${total}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <div className='space-y-6'>
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
                                const current =
                                  form.getValues('selectedMethods')
                                const updated = checked
                                  ? [...current, method.value]
                                  : current.filter((m) => m !== method.value)
                                form.setValue('selectedMethods', updated)
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

              {selectedMethods.length > 0 && (
                <div className='space-y-4'>
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
                                field.onChange(value)
                                const amounts = form.getValues('amounts')
                                setRemaining(
                                  calculateRemaining({
                                    ...amounts,
                                    [method]: value || 0
                                  })
                                )
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
