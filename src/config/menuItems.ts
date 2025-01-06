import { Package, HandShake, Bill, Hammer } from '../assets'

export const MENU_ITEMS = [
  {
    title: 'Inventario',
    url: '/inventory',
    icon: Package,
    roles: ['ADMIN']
  },
  {
    title: 'Proveedores',
    url: '/suppliers',
    icon: HandShake,
    roles: ['ADMIN']
  },
  {
    title: 'Facturación',
    url: '/billing',
    icon: Bill,
    roles: ['ADMIN', 'SELLER']
  },
  {
    title: 'Servicios',
    url: '/services',
    icon: Hammer,
    roles: ['ADMIN', 'SELLER']
  }
]