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
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Filtros básicos */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar cliente o documento..."
                value={filters.search || ''}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Estado */}
            <Select
              value={filters.status || 'all'}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger>
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
              <SelectTrigger>
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
              className="flex items-center gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtros Avanzados
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1">
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
            >
              Solo Vencidas
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4 mr-1" />
                Limpiar Filtros
              </Button>
            )}
          </div>

          {/* Filtros avanzados */}
          {showAdvancedFilters && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Filtros Avanzados
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Saldo mínimo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Saldo Mínimo
                  </label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={localMinBalance}
                    onChange={(e) => setLocalMinBalance(e.target.value)}
                    onBlur={handleBalanceFilter}
                    onKeyPress={(e) => e.key === 'Enter' && handleBalanceFilter()}
                  />
                </div>

                {/* Saldo máximo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Saldo Máximo
                  </label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={localMaxBalance}
                    onChange={(e) => setLocalMaxBalance(e.target.value)}
                    onBlur={handleBalanceFilter}
                    onKeyPress={(e) => e.key === 'Enter' && handleBalanceFilter()}
                  />
                </div>

                {/* Botón aplicar filtros de saldo */}
                <div className="flex items-end">
                  <Button
                    onClick={handleBalanceFilter}
                    variant="outline"
                    className="w-full"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Aplicar Filtros de Saldo
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Filtros activos */}
          {hasActiveFilters && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Filtros Activos:
              </h4>
              <div className="flex flex-wrap gap-2">
                {filters.search && (
                  <Badge variant="secondary">
                    Búsqueda: &quot;{filters.search}&quot;
                  </Badge>
                )}
                {filters.status && (
                  <Badge variant="secondary">
                    Estado: {filters.status === 'ACTIVE' ? 'Activa' :
                      filters.status === 'OVERDUE' ? 'Vencida' :
                        filters.status === 'SUSPENDED' ? 'Suspendida' : 'Cerrada'}
                  </Badge>
                )}
                {filters.documentType && (
                  <Badge variant="secondary">
                    Documento: {filters.documentType}
                  </Badge>
                )}
                {filters.hasOverdue && (
                  <Badge variant="secondary">
                    Solo Vencidas
                  </Badge>
                )}
                {(filters.minBalance || filters.maxBalance) && (
                  <Badge variant="secondary">
                    Saldo: {filters.minBalance ? formatCurrency(filters.minBalance) : '0'} - {filters.maxBalance ? formatCurrency(filters.maxBalance) : '∞'}
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