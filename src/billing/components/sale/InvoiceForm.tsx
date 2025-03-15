import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Input,
  RadioGroup,
  RadioGroupItem
} from '../../../components'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useSaleForm } from '../hooks/useSaleForm'
import { useEffect } from 'react'
import { Invoice } from '../../../types/sale.types'

const formSchema = z.object({
  type: z.enum(['TICKET', 'A', 'B', 'C']),
  documentType: z.enum(['DNI', 'CUIT']).optional(),
  documentNumber: z.string().optional(),
  customerName: z.string().optional()
})

type FormValues = z.infer<typeof formSchema>

const InvoiceForm = () => {
  const { invoice, handleInvoiceSubmit, setInvoice } = useSaleForm()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: invoice.type || 'TICKET',
      documentType: invoice.customer?.documentType,
      documentNumber: invoice.customer?.documentNumber,
      customerName: invoice.customerName
    }
  })

  const watchType = form.watch('type')
  const watchDocumentType = form.watch('documentType')

  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value) {
        const invoiceData: Invoice = {
          type: value.type as 'TICKET' | 'A' | 'B' | 'C',
          pointOfSale: 1
        }

        if (value.documentType && value.documentNumber) {
          invoiceData.customer = {
            documentType: value.documentType,
            documentNumber: value.documentNumber
          }
        }

        if (value.customerName) {
          invoiceData.customerName = value.customerName
        }

        setInvoice(invoiceData)
      }
    })
    return () => subscription.unsubscribe()
  }, [form.watch, setInvoice])

  return (
    <div className='max-h-[60vh] overflow-y-auto'>
      <Card>
        <CardHeader>
          <CardTitle>Tipo de Comprobante</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleInvoiceSubmit)}
              className='space-y-4'
            >
              <FormField
                control={form.control}
                name='type'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className='flex flex-col space-y-1'
                      >
                        <FormItem className='flex items-center space-x-3 space-y-0'>
                          <FormControl>
                            <RadioGroupItem value='TICKET' />
                          </FormControl>
                          <FormLabel className='font-normal'>Ticket</FormLabel>
                        </FormItem>
                        {['A', 'B', 'C'].map((type) => (
                          <FormItem
                            key={type}
                            className='flex items-center space-x-3 space-y-0'
                          >
                            <FormControl>
                              <RadioGroupItem value={type} />
                            </FormControl>
                            <FormLabel className='font-normal'>
                              Factura {type}
                            </FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />

              {watchType !== 'TICKET' && (
                <>
                  <FormField
                    control={form.control}
                    name='documentType'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Documento</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className='flex space-x-4'
                          >
                            <FormItem className='flex items-center space-x-2'>
                              <FormControl>
                                <RadioGroupItem value='DNI' />
                              </FormControl>
                              <FormLabel className='font-normal'>DNI</FormLabel>
                            </FormItem>
                            <FormItem className='flex items-center space-x-2'>
                              <FormControl>
                                <RadioGroupItem value='CUIT' />
                              </FormControl>
                              <FormLabel className='font-normal'>
                                CUIT
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='documentNumber'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Número de {watchDocumentType || 'Documento'}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!watchDocumentType} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='customerName'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Cliente</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

export default InvoiceForm
