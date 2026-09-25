import { AddressEntity } from '../entities/Address'

export interface CreateAddressInput {
  userId:    string
  line1:     string
  line2?:    string
  city:      string
  state:     string
  pincode:   string
  lat?:      number
  lng?:      number
  label?:    string
  isPrimary?: boolean
}

export interface UpdateAddressInput {
  line1?:   string
  line2?:   string
  city?:    string
  state?:   string
  pincode?: string
  lat?:     number
  lng?:     number
  label?:   string
  id ? :    string
  userId?:   string
  isPrimary?: boolean
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
