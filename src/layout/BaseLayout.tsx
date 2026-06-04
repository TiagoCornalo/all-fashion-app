import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  SidebarProvider,
  SidebarTrigger,
  AppSideBar,
  Loader
} from '../components'
import { IconComponent } from '../assets'
import { authService } from '../services/auth.service'
import { LOGIN_PATH } from '../consts'

type MenuItem = {
  title: string
  url: string
  icon: IconComponent
  roles: string[]
}

const BaseLayout = ({
  children,
  requiredRoles,
  menuItems,
  showGoBackButton = false
}: {
  children: React.ReactNode
  requiredRoles?: string[]
  menuItems: MenuItem[]
  showGoBackButton?: boolean
}) => {
  const currentUser = authService.getCurrentUser()
  const hasLocalAccess =
    authService.hasValidToken() &&
    (!requiredRoles || requiredRoles.includes(currentUser?.role))
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(!hasLocalAccess)
  const [userRole, setUserRole] = useState<string>(currentUser?.role || '')
  const [isAuthenticated, setIsAuthenticated] = useState(hasLocalAccess)
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false

    const validateUser = async () => {
      try {
        if (!authService.hasValidToken()) {
          navigate(LOGIN_PATH)
          return
        }

        const response = await authService.validateToken()

        if (!response) {
          authService.logout()
          navigate(LOGIN_PATH)
          return
        }

        if (requiredRoles && !requiredRoles.includes(response.user.role)) {
          navigate('/home')
          return
        }

        if (cancelled) return
        setUserRole(response.user.role)
        setIsAuthenticated(true)
      } catch (error) {
        console.error('Error de validación:', error)
        if (!hasLocalAccess) {
          authService.logout()
          navigate(LOGIN_PATH)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    validateUser()

    return () => {
      cancelled = true
    }
  }, [hasLocalAccess, navigate, requiredRoles])

  if (isLoading || !isAuthenticated) {
    return (
      <div className='fixed inset-0 flex justify-center items-center bg-white z-50'>
        <Loader className='h-8 w-8' />
      </div>
    )
  }

  const filteredItems = menuItems.filter((item) =>
    item.roles.includes(userRole)
  )

  return (
    <SidebarProvider open={isOpen} onOpenChange={setIsOpen}>
      <div className='relative flex min-h-screen w-full'>
        <AppSideBar items={filteredItems} showGoBackButton={showGoBackButton} />
        <main className='flex-1 flex flex-col gap-4 p-4 w-full overflow-x-hidden'>
          <SidebarTrigger />
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}

export default BaseLayout
