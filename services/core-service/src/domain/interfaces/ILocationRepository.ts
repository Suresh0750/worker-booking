export type LocationSearchKey = 'state' | 'city' | 'pincode'

export interface LocationQuery {
  searchKey: LocationSearchKey
  search?: string
  state?: string
  city?: string
}

export interface ILocationRepository {
  find(query: LocationQuery): string[]
}