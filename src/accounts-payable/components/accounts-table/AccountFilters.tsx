import { useState, useCallback } from 'react'
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
  Card,
  CardContent,
  Badge
} from '../../../components'
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react'
import { AccountsPayableFilters } from '../../../services/accountsPayable.service'
import { formatCurrency } from '../../../utils'

interface AccountFiltersProps {
  filters: AccountsPayableFilters
  onFiltersChange: (filters: Partial<AccountsPayableFilters>) => void
  availableStatuses: string[]
  availableDocumentTypes: string[]
}

/**
 * Componente de filtros para la tabla de cuentas corrientes
 */
const AccountFilters = ({
  filters,
  onFiltersChange,
  availableStatuses,
  availableDocumentTypes
}: AccountFiltersProps) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [localMinBalance, setLocalMinBalance] = useState(filters.minBalance?.toString() || '')
  const [localMaxBalance, setLocalMaxBalance] = useState(filters.maxBalance?.toString() || '')

  const handleSearchChange = useCallback((value: string) => {
    onFiltersChange({ search: value || undefined })
  }, [onFiltersChange])

  const handleStatusChange = useCallback((value: string) => {
    onFiltersChange({ status: value === 'all' ? undefined : value })
  }, [onFiltersChange])

  const handleDocumentTypeChange = useCallback((value: string) => {
    onFiltersChange({ documentType: value === 'all' ? undefined : value })
  }, [onFiltersChange])

  const handleOverdueFilter = useCallback((hasOverdue: boolean) => {
    onFiltersChange({ hasOverdue })
  }, [onFiltersChange])

  const handleBalanceFilter = useCallback(() => {
    const minBalance = localMinBalance ? parseFloat(localMinBalance) : undefined
    const maxBalance = localMaxBalance ? parseFloat(localMaxBalance) : undefined

    onFiltersChange({
      minBalance: minBalance && minBalance > 0 ? minBalance : undefined,
      maxBalance: maxBalance && maxBalance > 0 ? maxBalance : undefined
    })
  }, [localMinBalance, localMaxBalance, onFiltersChange])

  const handleClearFilters = useCallback(() => {
    onFiltersChange({
      search: undefined,
      status: undefined,
      documentType: undefined,
      hasOverdue: undefined,
      minBalance: undefined,
      maxBalance: undefined
    })
    setLocalMinBalance('')
    setLocalMaxBalance('')
  }, [onFiltersChange])

  const hasActiveFilters = !!(
    filters.search ||
    filters.status ||
    filters.documentType ||
    filters.hasOverdue ||
    filters.minBalance ||
    filters.maxBalance
  )

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.search) count++
    if (filters.status) count++
    if (filters.documentType) count++
    if (filters.hasOverdue) count++
    if (filters.minBalance || filters.maxBalance) count++
    return count
  }

  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <div className="space-y-3 sm:space-y-4">
          {/* Filtros básicos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Búsqueda */}
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 sm:h-4 sm:w-4" />
              <Input
                placeholder="Buscar cliente o documento..."
                value={filters.search || ''}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-8 sm:pl-10 text-xs sm:text-sm"
              />
            </div>

            {/* Estado */}
            <Select
              value={filters.status || 'all'}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="text-xs sm:text-sm">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {availableStatuses.map(status => (
                  <SelectItem key={status} value={status}>
                    {status === 'ACTIVE' ? 'Activa' :
                      status === 'OVERDUE' ? 'Vencida' :
                        status === 'SUSPENDED' ? 'Suspendida' : 'Cerrada'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Tipo de documento */}
            <Select
              value={filters.documentType || 'all'}
              onValueChange={handleDocumentTypeChange}
            >
              <SelectTrigger className="text-xs sm:text-sm">
                <SelectValue placeholder="Tipo documento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {availableDocumentTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Botón filtros avanzados */}
            <Button
              variant={showAdvancedFilters ? "default" : "outline"}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm w-full sm:w-auto"
              size="sm"
            >
              <SlidersHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Filtros Avanzados</span>
              <span className="sm:hidden">Avanzados</span>
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </Button>
          </div>

          {/* Filtros rápidos */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filters.hasOverdue ? "default" : "outline"}
              size="sm"
              onClick={() => handleOverdueFilter(!filters.hasOverdue)}
              className="text-xs sm:text-sm"
            >
              Solo Vencidas
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-red-600 hover:text-red-700 text-xs sm:text-sm"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden sm:inline">Limpiar Filtros</span>
                <span className="sm:hidden">Limpiar</span>
              </Button>
            )}
          </div>

          {/* Filtros avanzados */}
          {showAdvancedFilters && (
            <div className="border-t pt-3 sm:pt-4">
              <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-3">
                Filtros Avanzados
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {/* Saldo mínimo */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Saldo Mínimo
                  </label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={localMinBalance}
                    onChange={(e) => setLocalMinBalance(e.target.value)}
                    onBlur={handleBalanceFilter}
                    onKeyPress={(e) => e.key === 'Enter' && handleBalanceFilter()}
                    className="text-xs sm:text-sm"
                  />
                </div>

                {/* Saldo máximo */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Saldo Máximo
                  </label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={localMaxBalance}
                    onChange={(e) => setLocalMaxBalance(e.target.value)}
                    onBlur={handleBalanceFilter}
                    onKeyPress={(e) => e.key === 'Enter' && handleBalanceFilter()}
                    className="text-xs sm:text-sm"
                  />
                </div>

                {/* Botón aplicar filtros de saldo */}
                <div className="flex items-end sm:col-span-2 lg:col-span-1">
                  <Button
                    onClick={handleBalanceFilter}
                    variant="outline"
                    className="w-full text-xs sm:text-sm"
                    size="sm"
                  >
                    <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Aplicar Filtros de Saldo</span>
                    <span className="sm:hidden">Aplicar</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Filtros activos */}
          {hasActiveFilters && (
            <div className="border-t pt-3 sm:pt-4">
              <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Filtros Activos:
              </h4>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {filters.search && (
                  <Badge variant="secondary" className="text-xs">
                    <span className="hidden sm:inline">Búsqueda: &quot;{filters.search}&quot;</span>
                    <span className="sm:hidden">"{filters.search}"</span>
                  </Badge>
                )}
                {filters.status && (
                  <Badge variant="secondary" className="text-xs">
                    <span className="hidden sm:inline">Estado: </span>
                    {filters.status === 'ACTIVE' ? 'Activa' :
                      filters.status === 'OVERDUE' ? 'Vencida' :
                        filters.status === 'SUSPENDED' ? 'Suspendida' : 'Cerrada'}
                  </Badge>
                )}
                {filters.documentType && (
                  <Badge variant="secondary" className="text-xs">
                    <span className="hidden sm:inline">Documento: </span>
                    {filters.documentType}
                  </Badge>
                )}
                {filters.hasOverdue && (
                  <Badge variant="secondary" className="text-xs">
                    Solo Vencidas
                  </Badge>
                )}
                {(filters.minBalance || filters.maxBalance) && (
                  <Badge variant="secondary" className="text-xs break-all">
                    <span className="hidden sm:inline">Saldo: </span>
                    {filters.minBalance ? formatCurrency(filters.minBalance) : '0'} - {filters.maxBalance ? formatCurrency(filters.maxBalance) : '∞'}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default AccountFilters