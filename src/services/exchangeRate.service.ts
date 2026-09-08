import api from './config/axios'
import { ExchangeRate, Product, USDRateType } from '../types/inventory.types'
import { convertUsdToArs } from '../utils/usdPricing'

export const getExchangeRate = async (
  type: USDRateType = 'blue'
): Promise<ExchangeRate> => {
  const response = await api.get<ExchangeRate>('/config/exchange-rate', {
    params: { type }
  })
  return response.data
}

type UsdPricedProduct = Pick<
  Product,
  'price' | 'priceUSD' | 'usdRateType'
>

/**
 * Reemplaza cualquier precio ARS recibido del servidor por el cálculo vigente
 * cuando el producto tiene un precio base en USD. Esto mantiene consistente la
 * UI incluso si una respuesta proviene de un precio persistido desactualizado.
 */
export const applyCurrentUsdPrices = async <T extends UsdPricedProduct>(
  products: T[]
): Promise<T[]> => {
  const rateTypes = [
    ...new Set(
      products
        .filter((product) => Number(product.priceUSD) > 0)
        .map((product) => (product.usdRateType || 'blue') as USDRateType)
    )
  ]

  if (rateTypes.length === 0) return products

  const resolvedRates = await Promise.all(
    rateTypes.map(async (type) => {
      try {
        return [type, await getExchangeRate(type)] as const
      } catch {
        return [type, null] as const
      }
    })
  )
  const ratesByType = new Map<USDRateType, ExchangeRate | null>(resolvedRates)

  return products.map((product) => {
    const priceUSD = Number(product.priceUSD)
    if (!Number.isFinite(priceUSD) || priceUSD <= 0) return product

    const rateType = (product.usdRateType || 'blue') as USDRateType
    const rate = ratesByType.get(rateType)
    if (!rate) return product

    const convertedPrice = convertUsdToArs(
      priceUSD,
      rate.value,
      rate.surchargeArs
    )

    return convertedPrice === null
      ? product
      : { ...product, price: convertedPrice }
  })
}

export type RefreshExchangeRateResponse = {
  rate: ExchangeRate
  recalc: {
    recalculated: number
    skipped: number
    rate?: number
    surcharge?: number
    type?: string
    byType?: Record<
      string,
      {
        recalculated: number
        rate: number
        surcharge: number
        fetchedAt: string
      }
    >
    fetchedAt?: string
    reason?: string
  }
}

export const refreshExchangeRate = async (
  type: USDRateType = 'blue'
): Promise<RefreshExchangeRateResponse> => {
  const response = await api.post<RefreshExchangeRateResponse>(
    '/config/exchange-rate/refresh',
    { type }
  )
  return response.data
}
