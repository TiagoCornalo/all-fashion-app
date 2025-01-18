import LayoutMultiRole from '../layout/LayoutMultiRole'

export default function BillingContainer() {
  return (
    <LayoutMultiRole allowedRoles={['ADMIN', 'SELLER']}>
      <h1>Billing</h1>
    </LayoutMultiRole>
  )
}
