import BaseLayout from './BaseLayout'
import { MENU_ITEMS } from '../config/menuItems'

const LayoutMultiRole = ({
  children,
  allowedRoles
}: {
  children: React.ReactNode
  allowedRoles: string[]
}) => {
  return (
    <BaseLayout
      requiredRoles={allowedRoles}
      menuItems={MENU_ITEMS}
    >
      {children}
    </BaseLayout>
  )
}

export default LayoutMultiRole