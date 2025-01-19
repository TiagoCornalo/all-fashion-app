import BaseLayout from './BaseLayout'
import { MENU_ITEMS } from '../config/menuItems'

const LayoutAdmin = ({ children }: { children: React.ReactNode }) => {
  return (
    <BaseLayout requiredRoles={['ADMIN']} menuItems={MENU_ITEMS}>
      {children}
    </BaseLayout>
  )
}

export default LayoutAdmin
