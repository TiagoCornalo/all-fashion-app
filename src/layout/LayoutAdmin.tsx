import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SidebarProvider, SidebarTrigger, AppSideBar, Loader } from '../components'
import { Bill, Hammer, HandShake, Package, IconComponent } from '../assets'
import { authService } from '../services/auth.service'
import { LOGIN_PATH } from '../consts'

const LayoutAdmin = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const validateAdmin = async () => {
      try {
        if (!authService.hasValidToken()) {
          navigate(LOGIN_PATH)
          return
        }

        const response = await authService.validateToken()

        if (!response || response.user.role !== 'ADMIN') {
          authService.logout()
          navigate('/dashboard')
          return
        }

        setIsAuthorized(true)
      } catch (error) {
        console.error('Error de validación:', error)
        authService.logout()
        navigate(LOGIN_PATH)
      } finally {
        setIsLoading(false)
      }
    }

    validateAdmin()
  }, [navigate])

  if (isLoading || !isAuthorized) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <Loader className='h-8 w-8' />
      </div>
    )
  }

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
