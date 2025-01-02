import { IconComponent } from '../../assets'
import { ManRunning, Door } from '../../assets'
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

interface AppSidebarProps {
  items: {
    title: string
    url: string
    icon: IconComponent
  }[]
}

const AppSideBar = ({ items }: AppSidebarProps) => {
  return (
    <Sidebar variant='floating' collapsible='icon'>
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
