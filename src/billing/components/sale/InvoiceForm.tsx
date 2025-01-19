import { useSaleStore } from '../../../stores/saleStore'
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
  Button,
  RadioGroup,
  RadioGroupItem
} from '../../../components'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const formSchema = z.object({
  type: z.enum(['TICKET', 'FACTURA_A', 'FACTURA_B']),
  customerName: z.string().optional(),
  customerDocument: z.string().optional()
})

type FormValues = z.infer<typeof formSchema>

interface InvoiceFormProps {
  onComplete: () => void
}

const InvoiceForm = ({ onComplete }: InvoiceFormProps) => {
  const { setInvoice } = useSaleStore()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'TICKET'
    }
  })

  const onSubmit = (values: FormValues) => {
    setInvoice(values)
    onComplete()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tipo de Comprobante</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
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
                      <FormItem className='flex items-center space-x-3 space-y-0'>
                        <FormControl>
                          <RadioGroupItem value='FACTURA_A' />
                        </FormControl>
                        <FormLabel className='font-normal'>Factura A</FormLabel>
                      </FormItem>
                      <FormItem className='flex items-center space-x-3 space-y-0'>
                        <FormControl>
                          <RadioGroupItem value='FACTURA_B' />
                        </FormControl>
                        <FormLabel className='font-normal'>Factura B</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('type') !== 'TICKET' && (
              <>
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

                <FormField
                  control={form.control}
                  name='customerDocument'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CUIT/DNI</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <div className='flex justify-end'>
              <Button type='submit'>Continuar</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default InvoiceForm
