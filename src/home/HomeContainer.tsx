import { LayoutMultiRole } from '../layout'
import logo from '../assets/logo.png'
import { Link } from 'react-router-dom'
import { MENU_ITEMS } from '../config/menuItems'
import { ExternalLink } from 'lucide-react'
import { Money } from '../assets'

const HomeContainer = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // Filtrar los menús según el rol del usuario
  const filteredMenuItems = MENU_ITEMS.filter(
    (item) => item.roles.includes(user?.role || '') && !item.disabled
  )

  return (
    <LayoutMultiRole allowedRoles={['ADMIN', 'SELLER', 'MANAGER']}>
      <div className='flex flex-col gap-6 items-center w-full'>
        {/* Sección de bienvenida */}
        <div className='flex flex-col gap-2 justify-center items-center text-center'>
          <img
            src={logo}
            alt='logo'
            className='w-60 h-60 select-none pointer-events-none'
          />
          <h1 className='text-3xl font-bold'>¡Bienvenido, {user?.name}!</h1>
          <p className='text-gray-600 max-w-md'>
            Selecciona una de las siguientes opciones para comenzar a trabajar
          </p>
        </div>

        {/* Sección de acciones rápidas */}
        <div className='w-full'>
          <h2 className='text-xl font-semibold mb-4 px-4'>Acciones Rápidas</h2>

          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 px-4'>
            {(user?.role === 'ADMIN' || user?.role === 'SELLER') && (
              <Link
                to='/billing?new=true'
                className='bg-green-50 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow flex flex-col items-center text-center gap-3 border border-green-100'
              >
                <div className='bg-green-100 p-3 rounded-full'>
                  {/* @ts-ignore */}
                  <Money className='h-8 w-8 text-green-600' />
                </div>
                <h3 className='font-semibold text-lg'>Nueva Venta</h3>
                <div className='flex items-center text-green-600 text-sm mt-auto'>
                  <span>Iniciar venta</span>
                  <ExternalLink className='h-4 w-4 ml-1' />
                </div>
              </Link>
            )}
            {filteredMenuItems.map((item) => (
              <Link
                key={item.url}
                to={item.url}
                className='bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow flex flex-col items-center text-center gap-3 border border-gray-100'
              >
                <div className='bg-blue-50 p-3 rounded-full'>
                  {/* @ts-ignore */}
                  <item.icon className='h-8 w-8 text-blue-600' />
                </div>
                <h3 className='font-semibold text-lg'>{item.title}</h3>
                <div className='flex items-center text-blue-600 text-sm mt-auto'>
                  <span>Acceder</span>
                  <ExternalLink className='h-4 w-4 ml-1' />
                </div>
              </Link>
            ))}

            {/* Acciones adicionales según el rol */}
            {user?.role === 'ADMIN' && (
              <Link
                to='/settings'
                className='bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow flex flex-col items-center text-center gap-3 border border-gray-100'
              >
                <div className='bg-blue-50 p-3 rounded-full'>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='h-8 w-8 text-blue-600'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  >
                    <path d='M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z'></path>
                    <circle cx='12' cy='12' r='3'></circle>
                  </svg>
                </div>
                <h3 className='font-semibold text-lg'>Configuración</h3>
                <div className='flex items-center text-blue-600 text-sm mt-auto'>
                  <span>Acceder</span>
                  <ExternalLink className='h-4 w-4 ml-1' />
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </LayoutMultiRole>
  )
}

export default HomeContainer
