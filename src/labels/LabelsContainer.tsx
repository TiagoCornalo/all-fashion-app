import { LayoutMultiRole } from '../layout'
import { LabelPrintCenter } from '../inventory/components/LabelPrintDialog'

export default function LabelsContainer() {
  return <LayoutMultiRole allowedRoles={['ADMIN', 'SELLER', 'MANAGER']}>
    <main className='mx-auto w-full max-w-5xl space-y-5 p-4'>
      <div><h1 className='text-2xl font-bold'>Etiquetas de productos</h1><p className='text-sm text-muted-foreground'>Prepará etiquetas y reimprimilas cuando las necesites.</p></div>
      <LabelPrintCenter />

    </main>
  </LayoutMultiRole>
}
