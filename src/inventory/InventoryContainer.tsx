import LayoutAdmin from '../layout/LayoutAdmin'
import { InventoryProvider } from './context/InventoryContext'
import { useState, useEffect } from 'react'
import {
  Product,
  PaginatedResponse,
  TableFilters
} from '../types/inventory.types'
import { InventoryAlerts, DataTable } from './components'
import { columns } from './components/inventory-table/components/Columns'
import { fetchProducts } from '../services/index'
import { authService } from '../services/auth.service'
import { useNavigate } from 'react-router-dom'
import { LOGIN_PATH } from '../consts'

const InventoryContainer = () => {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<TableFilters>({
    page: 1,
    pageSize: 10
  })

  const [tableData, setTableData] = useState<PaginatedResponse<Product>>({
    data: [],
    meta: {
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0
    }
  })

  const fetchProductsData = async (tableFilters: TableFilters) => {
    if (!authService.isAuthenticated()) {
      navigate(LOGIN_PATH)
      return
    }

    try {
      const data = await fetchProducts(tableFilters)
      setTableData(data)
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  useEffect(() => {
    fetchProductsData(filters)
  }, [filters])

  const handleTableChange = (newFilters: Partial<TableFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters
    }))
  }

  const handleRefresh = async () => {
    await fetchProductsData(filters)
  }

  return (
    <LayoutAdmin>
      <InventoryProvider onRefresh={handleRefresh}>
        <section className='w-full p-4'>
          <h1 className='text-3xl font-bold mb-6'>Inventario</h1>
          <InventoryAlerts />
        </section>

        <section className='w-full p-4'>
          <DataTable
            columns={({ onEdit, onDelete }) => columns({ onEdit, onDelete })}
            data={tableData.data}
            pageCount={tableData.meta.totalPages}
            onPaginationChange={(page: number, pageSize: number) =>
              handleTableChange({ page, pageSize })
            }
            onSortingChange={(sortBy: string, sortOrder: 'asc' | 'desc') =>
              handleTableChange({ sortBy, sortOrder })
            }
            onFilterChange={(filters: Record<string, string>) =>
              handleTableChange({ filters })
            }
            onSearchChange={(search: string) =>
              handleTableChange({
                search
              })
            }
            initialPage={tableData.meta.page - 1}
            initialPageSize={tableData.meta.pageSize}
            onRefresh={handleRefresh}
          />
        </section>
      </InventoryProvider>
    </LayoutAdmin>
  )
}

export default InventoryContainer
