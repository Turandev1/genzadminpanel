import { describe, expect, it } from 'vitest'
import { dataProvider } from './dataProvider'

describe('development data provider', () => {
  it('paginates and searches registered resources', async () => {
    const result = await dataProvider.getList('clubs', { pagination: { page: 1, perPage: 2 }, sort: { field: 'name', order: 'ASC' }, filter: { q: 'Baku' } })
    expect(result.total).toBe(1)
    expect(result.data[0]).toMatchObject({ name: 'Baku Creators' })
  })

  it('rejects unknown resources in the production registry contract', async () => {
    const result = await dataProvider.getList('unknown-resource', { pagination: { page: 1, perPage: 10 }, sort: { field: 'id', order: 'ASC' }, filter: {} })
    expect(result.data).toEqual([])
  })
})
