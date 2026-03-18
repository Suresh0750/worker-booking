import { AddressEntity } from '../entities/User'

export interface CreateAddressInput {
  userId:    string
  line1:     string
  line2?:    string
  city:      string
  state:     string
  pincode:   string
  lat?:      number
  lng?:      number
  isPrimary?: boolean
}

export interface UpdateAddressInput {
  line1?:    string
  line2?:    string
  city?:     string
  state?:    string
  pincode?:  string
  lat?:      number
  lng?:      number
}

export interface IAddressRepository {
  findById(id: string): Promise<AddressEntity | null>
  findByUserId(userId: string): Promise<AddressEntity[]>
  findPrimary(userId: string): Promise<AddressEntity | null>
  create(data: CreateAddressInput): Promise<AddressEntity>
  update(id: string, data: UpdateAddressInput): Promise<AddressEntity>
  setPrimary(id: string, userId: string): Promise<void>
  delete(id: string): Promise<void>
}
