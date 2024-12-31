import { useState } from 'react'
import { SidebarProvider, SidebarTrigger, AppSideBar } from '../components'
import { Bill, Hammer, HandShake, Package, IconComponent } from '../assets'

const LayoutAdmin = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false)

  const items: Array<{
    title: string
    url: string
    icon: IconComponent
  }> = [
    {
      title: 'Inventario',
      url: '/inventory',
      icon: Package
    },
    {
      title: 'Proveedores',
      url: '#',
      icon: HandShake
    },
    {
      title: 'Facturación',
      url: '#',
      icon: Bill
    },
    {
      title: 'Servicios',
      url: '#',
      icon: Hammer
    }
  ]

  return (
    <SidebarProvider open={isOpen} onOpenChange={setIsOpen}>
      <div className='relative flex min-h-screen w-full'>
        <AppSideBar items={items} />
        <main className='flex-1 flex flex-col gap-4 p-4 w-full overflow-x-hidden'>
          <SidebarTrigger />
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}

export default LayoutAdmin
