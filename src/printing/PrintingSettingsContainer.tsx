import { LayoutAdmin } from '../layout'
import PrinterSettings from '../components/shared/PrinterSettings'

export default function PrintingSettingsContainer() {
  return <LayoutAdmin><main className='mx-auto w-full max-w-2xl space-y-4 p-4'><h1 className='text-2xl font-bold'>Configuración de impresión</h1><PrinterSettings /></main></LayoutAdmin>
}
