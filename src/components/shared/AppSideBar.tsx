import { IconComponent } from '../../assets'
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
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>All Fashion Distruibuidora</SidebarGroupLabel>
          <SidebarGroupContent>
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
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

export default AppSideBar
