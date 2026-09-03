export const getEffectiveUsdRate = (
  rate: number,
  surchargeArs = 0
): number | null => {
  const numericRate = Number(rate)
  const numericSurcharge = Number(surchargeArs || 0)

  if (!Number.isFinite(numericRate) || numericRate <= 0) return null
  if (!Number.isFinite(numericSurcharge) || numericSurcharge < 0) return null

  return numericRate + numericSurcharge
}

export const convertUsdToArs = (
  priceUSD: number,
  rate: number,
  surchargeArs = 0
): number | null => {
  const numericPriceUSD = Number(priceUSD)
  const effectiveRate = getEffectiveUsdRate(rate, surchargeArs)

  if (!Number.isFinite(numericPriceUSD) || numericPriceUSD <= 0) return null
  if (effectiveRate === null) return null

  return Math.round(numericPriceUSD * effectiveRate * 100) / 100
}
