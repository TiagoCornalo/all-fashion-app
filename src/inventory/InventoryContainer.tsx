import LayoutAdmin from '../layout/LayoutAdmin'
import { InventoryProvider } from './context/InventoryContext'
import { useState, useEffect } from 'react'
import {
  Product,
  PaginatedResponse,
  TableFilters
} from '../types/inventory.types'
import { InventoryAlerts, InventoryAddProduct, DataTable } from './components'
import { columns } from './components/inventory-table/components/Columns'
import { fetchProducts } from '../services/index'

const InventoryContainer = () => {
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

  const handleRefresh = () => {
    fetchProductsData(filters)
  }

  return (
    <LayoutAdmin>
      <InventoryProvider onRefresh={handleRefresh}>
      <section className='w-full p-4'>
        <h1 className='text-3xl font-bold mb-6'>Inventario</h1>
        <InventoryAlerts />
      </section>

      <section className='w-full p-4'>
        <div className='flex justify-between items-center mb-6'>
          <InventoryAddProduct />
        </div>

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
          />
        </section>
      </InventoryProvider>
    </LayoutAdmin>
  )
}

export default InventoryContainer
