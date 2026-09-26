import { expect, it } from 'vitest'
import { matchesSearch } from './textSearch'

it('matches accents, whitespace, partial and reordered words across fields', () => {
  expect(matchesSearch('  azul   pantalon ', 'Pantalón de jean azul')).toBe(true)
  expect(matchesSearch('PÁNTALON azu', 'Pantalon azul')).toBe(true)
  expect(matchesSearch('azul 123', 'Pantalón azul', 'P123')).toBe(true)
  expect(matchesSearch('azul rojo', 'Pantalón azul')).toBe(false)
  expect(matchesSearch('.*', 'Pantalón azul')).toBe(false)
  expect(matchesSearch('a+b', 'Modelo A+B')).toBe(true)
  expect(matchesSearch('  ', undefined)).toBe(true)
})
