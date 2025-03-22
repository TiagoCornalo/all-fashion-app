import { IconComponent } from '../../assets'
import { ManRunning, Door, House } from '../../assets'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '../../components/ui/sidebar'
import { authService } from '../../services/auth.service'
import { LOGIN_PATH } from '../../consts'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/button'
import { ChevronLeft } from 'lucide-react'

interface AppSidebarProps {
  items: {
    title: string
    url: string
    icon: IconComponent
  }[]
  showGoBackButton?: boolean
}

const AppSideBar = ({ items, showGoBackButton = false }: AppSidebarProps) => {
  const navigate = useNavigate()

  const handleGoBack = (): void => {
    navigate(-1)
  }
  return (
    <Sidebar variant='floating' collapsible='icon'>
      {showGoBackButton && (
        <Button
          variant='secondary'
          size='sm'
          className='fixed top-10 left-20 rounded-full p-3 shadow-lg z-50 bg-white text-black hover:bg-gray-100'
          onClick={handleGoBack}
          aria-label='Volver atrás'
        >
          <ChevronLeft className='h-5 w-5' />
        </Button>
      )}
      <SidebarContent className='h-full'>
        <SidebarGroup className='h-full flex flex-col'>
          <SidebarGroupLabel>All Fashion Distruibuidora</SidebarGroupLabel>
          <SidebarGroupContent className='flex flex-col h-full'>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>

            <div className='mt-auto'>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href={'/dashboard'}>
                      <House />
                      <span>Inicio</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <button
                      onClick={() => {
                        authService.logout()
                        window.location.href = LOGIN_PATH
                      }}
                      className='flex items-center w-full'
                    >
                      <Door />
                      <ManRunning />
                      <span>Cerrar sesión</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

export default AppSideBar
