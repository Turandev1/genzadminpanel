import type { DataProvider, Identifier, RaRecord } from 'react-admin'
import { runtimeConfig } from '../app/runtimeConfig'
import { demoData, type DemoRecord } from './demoData'
import { apiRequest } from './httpClient'
import { resourceContractMap } from './resourceRegistry'

type ListEnvelope = { items: RaRecord[]; total: number; page_info?: { has_next_page: boolean; next_cursor?: string } }

function contractFor(resource: string) {
  const contract = resourceContractMap.get(resource)
  if (!contract) throw new Error(`Qeydiyyatda olmayan resurs: ${resource}`)
  return contract
}

const realDataProvider: DataProvider = {
  supportAbortSignal: true,
  async getList(resource, params) {
    const contract = contractFor(resource)
    const query = new URLSearchParams({
      page: String(params.pagination?.page || 1),
      per_page: String(params.pagination?.perPage || 25),
      sort: params.sort?.field || 'updated_at',
      order: params.sort?.order || 'DESC',
    })
    Object.entries(params.filter || {}).forEach(([key, value]) => {
      if (value !== '' && value !== undefined && value !== null) query.set(key, String(value))
    })
    const response = await apiRequest<ListEnvelope>(`${contract.path}?${query}`, { signal: params.signal })
    return { data: response.items as never[], total: response.total, pageInfo: response.page_info ? { hasNextPage: response.page_info.has_next_page } : undefined }
  },
  async getOne(resource, params) {
    const data = await apiRequest<RaRecord>(`${contractFor(resource).path}/${params.id}`, { signal: params.signal })
    return { data: data as never }
  },
  async getMany(resource, params) {
    const query = new URLSearchParams()
    params.ids.forEach((id) => query.append('id', String(id)))
    const response = await apiRequest<ListEnvelope>(`${contractFor(resource).path}?${query}`, { signal: params.signal })
    return { data: response.items as never[] }
  },
  async getManyReference(resource, params) {
    return realDataProvider.getList(resource, { ...params, filter: { ...params.filter, [params.target]: params.id } })
  },
  async create(resource, params) {
    const data = await apiRequest<RaRecord>(contractFor(resource).path, { method: 'POST', body: params.data })
    return { data: data as never }
  },
  async update(resource, params) {
    const headers = new Headers()
    const version = params.meta?.version ?? params.previousData?.version
    if (version !== undefined) headers.set('If-Match', `"${String(version)}"`)
    headers.set('Idempotency-Key', crypto.randomUUID())
    const data = await apiRequest<RaRecord>(`${contractFor(resource).path}/${params.id}`, { method: 'PATCH', headers, body: params.data })
    return { data: data as never }
  },
  async updateMany(resource, params) {
    const results = await Promise.all(params.ids.map((id) => realDataProvider.update(resource, { id, data: params.data, previousData: undefined })))
    return { data: results.map((item) => item.data.id) }
  },
  async delete(resource, params) {
    const data = await apiRequest<RaRecord>(`${contractFor(resource).path}/${params.id}/archive`, { method: 'POST', body: { reason: params.meta?.reason || 'Admin panel archive' } })
    return { data: data as never }
  },
  async deleteMany(resource, params) {
    const results = await Promise.all(params.ids.map((id) => realDataProvider.delete(resource, { id, previousData: undefined })))
    return { data: results.map((item) => item.data.id) }
  },
}

function records(resource: string): DemoRecord[] {
  return demoData[resource] || []
}

function matchesFilter(record: DemoRecord, filter: Record<string, unknown>): boolean {
  const search = String(filter.q || '').toLocaleLowerCase('az')
  if (search && !Object.values(record).some((value) => String(value ?? '').toLocaleLowerCase('az').includes(search))) return false
  return Object.entries(filter).every(([key, value]) => key === 'q' || value === '' || value == null || String(record[key]) === String(value))
}

const demoDataProvider: DataProvider = {
  supportAbortSignal: true,
  async getList(resource, params) {
    const filtered = records(resource).filter((item) => matchesFilter(item, params.filter || {}))
    const field = params.sort?.field || 'id'
    const order = params.sort?.order === 'ASC' ? 1 : -1
    filtered.sort((a, b) => String(a[field] ?? '').localeCompare(String(b[field] ?? ''), 'az') * order)
    const page = params.pagination?.page || 1
    const perPage = params.pagination?.perPage || 25
    return { data: filtered.slice((page - 1) * perPage, page * perPage) as never[], total: filtered.length }
  },
  async getOne(resource, params) {
    const data = records(resource).find((item) => String(item.id) === String(params.id))
    if (!data) throw new Error('Resurs tapılmadı')
    return { data: data as never }
  },
  async getMany(resource, params) {
    return { data: records(resource).filter((item) => params.ids.map(String).includes(String(item.id))) as never[] }
  },
  async getManyReference(resource, params) {
    return demoDataProvider.getList(resource, { ...params, filter: { ...params.filter, [params.target]: params.id } })
  },
  async create(resource, params) {
    const data = { ...params.data, id: crypto.randomUUID(), status: params.data.status || 'draft', updated_at: new Date().toISOString(), version: 1 } as DemoRecord
    records(resource).unshift(data)
    return { data: data as never }
  },
  async update(resource, params) {
    const index = records(resource).findIndex((item) => String(item.id) === String(params.id))
    const data = { ...records(resource)[index], ...params.data, id: params.id, updated_at: new Date().toISOString() } as DemoRecord
    if (index >= 0) records(resource)[index] = data
    return { data: data as never }
  },
  async updateMany(resource, params) {
    for (const id of params.ids) await demoDataProvider.update(resource, { id, data: params.data, previousData: undefined })
    return { data: params.ids as Identifier[] }
  },
  async delete(resource, params) {
    const item = records(resource).find((record) => String(record.id) === String(params.id)) || { id: params.id }
    const index = records(resource).indexOf(item)
    if (index >= 0) records(resource).splice(index, 1)
    return { data: item as never }
  },
  async deleteMany(resource, params) {
    demoData[resource] = records(resource).filter((item) => !params.ids.map(String).includes(String(item.id)))
    return { data: params.ids as Identifier[] }
  },
}

export const dataProvider = runtimeConfig.demoMode ? demoDataProvider : realDataProvider

export async function publishResource(resource: string, id: Identifier): Promise<RaRecord> {
  if (runtimeConfig.demoMode) {
    const result = await demoDataProvider.update(resource, { id, data: { status: resource === 'clubs' ? 'active' : 'published' }, previousData: undefined })
    return result.data
  }
  return apiRequest<RaRecord>(`${contractFor(resource).path}/${id}/publish`, { method: 'POST' })
}
