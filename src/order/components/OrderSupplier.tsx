import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../components/ui/card'
import { Building, Mail, Phone } from 'lucide-react'
import { Supplier } from './types'

interface OrderSupplierProps {
  supplier: Supplier | null
}

const OrderSupplier = ({ supplier }: OrderSupplierProps) => {
  if (!supplier) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center'>
            <Building className='mr-2 h-5 w-5' />
            Proveedor no disponible
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center'>
          <Building className='mr-2 h-5 w-5' />
          Proveedor
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-2'>
          <div>
            <p className='text-sm text-gray-500'>Nombre</p>
            <p className='font-medium'>{supplier.name}</p>
          </div>

          {supplier.contact && (
            <>
              {supplier.contact.email && (
                <div className='flex items-center gap-2'>
                  <Mail className='h-4 w-4 text-gray-500' />
                  <a
                    href={`mailto:${supplier.contact.email}`}
                    className='text-blue-600 hover:underline'
                  >
                    {supplier.contact.email}
                  </a>
                </div>
              )}

              {supplier.contact.phone && (
                <div className='flex items-center gap-2'>
                  <Phone className='h-4 w-4 text-gray-500' />
                  <a
                    href={`tel:${supplier.contact.phone}`}
                    className='text-blue-600 hover:underline'
                  >
                    {supplier.contact.phone}
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default OrderSupplier
