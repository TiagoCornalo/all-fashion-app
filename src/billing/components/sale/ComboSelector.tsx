import { useState, useEffect } from 'react'
import { useSaleStore } from '../../../stores/saleStore'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Input,
  Button
} from '../../../components'
import { Combo } from '../../../types/sale.types'
import { Search, Plus, Minus, Trash } from 'lucide-react'
import { useDebounce } from '../../../hooks/useDebounce'
import api from '../../../services/config/axios'

interface ProductCombo {
  _id: string
  name: string
  code: string
  price: number
  description?: string
  isActive: boolean
}

const ComboSelector = () => {
  const [search, setSearch] = useState('')
  const [availableCombos, setAvailableCombos] = useState<ProductCombo[]>([])
  const [loading, setLoading] = useState(false)
  const debouncedSearch = useDebounce(search, 300)

  const { combos, addCombo, removeCombo, updateComboQuantity } = useSaleStore()

  useEffect(() => {
    const fetchCombos = async () => {
      if (!debouncedSearch) {
        setAvailableCombos([])
        return
      }

      try {
        setLoading(true)
        const response = await api.get(
          `/combos?search=${debouncedSearch}&pageSize=5`
        )
        setAvailableCombos(response.data.data)
      } catch (error) {
        console.error('Error buscando combos:', error)
        setAvailableCombos([])
      } finally {
        setLoading(false)
      }
    }

    fetchCombos()
  }, [debouncedSearch])

  const handleAddCombo = (productCombo: ProductCombo) => {
    const existingCombo = combos.find(
      (combo) => combo.comboId === productCombo._id
    )

    if (existingCombo) {
      updateComboQuantity(productCombo._id, existingCombo.quantity + 1)
    } else {
      const newCombo: Combo = {
        comboId: productCombo._id,
        quantity: 1,
        name: productCombo.name,
        price: productCombo.price
      }
      addCombo(newCombo)
    }

    setSearch('')
    setAvailableCombos([])
  }

  const handleQuantityChange = (comboId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeCombo(comboId)
    } else {
      updateComboQuantity(comboId, newQuantity)
    }
  }

  return (
    <div className='max-h-[60vh] overflow-y-auto mt-4'>
      <div className='space-y-4 p-1'>
        <h3 className='font-medium'>Combos y Promociones</h3>

        {/* Buscador de combos */}
        <div className='relative'>
          <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Buscar combos...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-8'
          />
        </div>

        {/* Lista de combos encontrados */}
        {loading ? (
          <div>Buscando combos...</div>
        ) : (
          search && (
            <div className='border rounded-md max-h-48 overflow-y-auto'>
              {availableCombos.map((combo) => (
                <div
                  key={combo._id}
                  className={`p-2 hover:bg-accent cursor-pointer flex justify-between items-center ${
                    !combo.isActive ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={() => combo.isActive && handleAddCombo(combo)}
                >
                  <div>
                    <div>{combo.name}</div>
                    <div className='text-sm text-muted-foreground'>
                      {combo.description || combo.code}
                      {!combo.isActive && ' (No disponible)'}
                    </div>
                  </div>
                  <div className='font-medium'>${combo.price}</div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Tabla de combos seleccionados */}
        {combos.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Combo</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Subtotal</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {combos.map((combo: Combo) => (
                <TableRow key={combo.comboId}>
                  <TableCell>{combo.name}</TableCell>
                  <TableCell>
                    <div className='flex items-center space-x-2'>
                      <Button
                        variant='outline'
                        size='icon'
                        onClick={() =>
                          handleQuantityChange(
                            combo.comboId,
                            combo.quantity - 1
                          )
                        }
                      >
                        <Minus className='h-4 w-4' />
                      </Button>
                      <span>{combo.quantity}</span>
                      <Button
                        variant='outline'
                        size='icon'
                        onClick={() =>
                          handleQuantityChange(
                            combo.comboId,
                            combo.quantity + 1
                          )
                        }
                      >
                        <Plus className='h-4 w-4' />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>${combo.price}</TableCell>
                  <TableCell>
                    ${(combo.price || 0) * (combo.quantity || 0)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => removeCombo(combo.comboId)}
                    >
                      <Trash className='h-4 w-4' />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}

export default ComboSelector
