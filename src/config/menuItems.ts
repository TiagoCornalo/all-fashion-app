import { Package, HandShake, Bill, Hammer, Label, BarChart } from '../assets'

export const MENU_ITEMS = [
  {
    title: 'Inventario',
    url: '/inventory',
    icon: Package,
    roles: ['ADMIN', 'MANAGER']
  },
  {
    title: 'Proveedores',
    url: '/suppliers',
    icon: HandShake,
    roles: ['ADMIN', 'MANAGER']
  },
  {
    title: 'Facturación',
    url: '/billing',
    icon: Bill,
    roles: ['ADMIN', 'SELLER', 'MANAGER']
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
    title: 'Servicios',
    url: '/services',
    icon: Hammer,
    roles: ['ADMIN', 'SELLER', 'MANAGER'],
    disabled: true
  }
]
