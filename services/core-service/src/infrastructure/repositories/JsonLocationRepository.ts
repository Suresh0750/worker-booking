import fs from 'fs'
import path from 'path'
import { ILocationRepository, LocationQuery } from '@domain/interfaces/ILocationRepository'

interface LocationRecord {
  State?: string
  City?: string
  Pincode?: string | number
}

export class JsonLocationRepository implements ILocationRepository {
  private readonly records: LocationRecord[]

  constructor(filePath = path.join(process.cwd(), 'json', 'Location', 'data.json')) {
    this.records = JSON.parse(fs.readFileSync(filePath, 'utf8')) as LocationRecord[]
  }

  find({ searchKey, search, state, city }: LocationQuery): string[] {
    const normalizedSearch = search?.trim().toLowerCase()
    const values = this.records
      .filter(record => !state || record.State?.toLowerCase() === state.trim().toLowerCase())
      .filter(record => !city || record.City?.toLowerCase() === city.trim().toLowerCase())
      .map(record => {
        if (searchKey === 'state') return record.State
        if (searchKey === 'city') return record.City
        return record.Pincode === undefined ? undefined : String(record.Pincode)
      })
      .filter((value): value is string => Boolean(value))
      .filter(value => !normalizedSearch || value.toLowerCase().includes(normalizedSearch))

    return [...new Set(values)].sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))
  }
}