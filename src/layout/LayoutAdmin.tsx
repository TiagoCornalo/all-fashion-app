import BaseLayout from './BaseLayout'
import { MENU_ITEMS } from '../config/menuItems'

const ADMIN_ROLES = ['ADMIN']

const LayoutAdmin = ({ children }: { children: React.ReactNode }) => {
  return (
    <BaseLayout requiredRoles={ADMIN_ROLES} menuItems={MENU_ITEMS}>
      {children}
    </BaseLayout>
  )
}

export default LayoutAdmin
