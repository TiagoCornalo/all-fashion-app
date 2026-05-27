import { Package, HandShake, Bill, Label, BarChart, CreditCard, Memo } from '../assets'
import { CheckCircle, Users, FileText, Settings } from 'lucide-react'

export const MENU_ITEMS = [
  {
    title: 'Inventario',
    url: '/inventory',
    icon: Package,
    roles: ['ADMIN', 'MANAGER']
  },
  {
    title: 'Facturación',
    url: '/billing',
    icon: Bill,
    roles: ['ADMIN', 'SELLER', 'MANAGER']
  },
  {
    title: 'Remitos/Presupuestos',
    url: '/quotes',
    icon: Memo,
    roles: ['ADMIN', 'SELLER', 'MANAGER']
  },
  {
    title: 'Proveedores',
    url: '/suppliers',
    icon: HandShake,
    roles: ['ADMIN', 'MANAGER']
  },
  {
    title: 'Verificación Pedidos',
    url: '/orders/verification',
    icon: CheckCircle,
    roles: ['ADMIN', 'SELLER', 'MANAGER']
  },
  {
    title: 'Cuentas Corrientes',
    url: '/accounts-payable',
    icon: CreditCard,
    roles: ['ADMIN', 'MANAGER', 'SELLER']
  },
  {
    title: 'Descuentos',
    url: '/discounts',
    icon: Label,
    roles: ['ADMIN', 'MANAGER']
  },
  {
    title: 'Combos',
    url: '/combos',
    icon: Package,
    roles: ['ADMIN', 'MANAGER']
  },
  {
    title: 'Análisis',
    url: '/dashboard',
    icon: BarChart,
    roles: ['ADMIN', 'MANAGER']
  },
  {
    title: 'Gestión de Usuarios',
    url: '/users',
    icon: Users,
    roles: ['ADMIN']
  },
  {
    title: 'Configuración de pagos',
    url: '/payment-settings',
    icon: Settings,
    roles: ['ADMIN']
  },
/*   {
    title: 'Servicios',
    url: '/services',
    icon: Hammer,
    roles: ['ADMIN', 'SELLER', 'MANAGER'],
    disabled: true
  } */
]
