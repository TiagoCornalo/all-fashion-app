import BaseLayout from './BaseLayout'
import { MENU_ITEMS } from '../config/menuItems'

const LayoutMultiRole = ({
  children,
  allowedRoles,
  showGoBackButton = false
}: {
  children: React.ReactNode
  allowedRoles: ('ADMIN' | 'SELLER' | 'MANAGER')[]
  showGoBackButton?: boolean
}) => {
  return (
    <BaseLayout
      requiredRoles={allowedRoles}
      menuItems={MENU_ITEMS}
      showGoBackButton={showGoBackButton}
    >
      {children}
    </BaseLayout>
  )
}

export default LayoutMultiRole
