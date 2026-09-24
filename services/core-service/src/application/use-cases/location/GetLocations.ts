import { ILocationRepository, LocationQuery } from '@domain/interfaces/ILocationRepository'

export class GetLocations {
  constructor(private readonly locationRepository: ILocationRepository) {}

  execute(query: LocationQuery): string[] {
    return this.locationRepository.find(query)
  }
}