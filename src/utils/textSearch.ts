export const normalizeSearch = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ')

export function matchesSearch(query: string, ...fields: (string | undefined)[]) {
  const values = fields.map(field => normalizeSearch(field || ''))
  return normalizeSearch(query).split(' ').filter(Boolean).every(token => values.some(value => value.includes(token)))
}
