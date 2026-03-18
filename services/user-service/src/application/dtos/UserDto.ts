import { Role } from '../entities/User'

// ── User DTOs ─────────────────────────────────────────────
export interface CreateProfileDto {
  userId: string
  email:  string
  role:   string
}

export interface UpdateProfileDto {
  name?:   string
  phone?:  string
  avatar?: string
}

export interface UserResponseDto {
  id:        string
  email:     string
  name:      string | null
  phone:     string | null
  avatar:    string | null
  role:      Role
  createdAt: Date
}

// ── Address DTOs ──────────────────────────────────────────
export interface CreateAddressDto {
  line1:     string
  line2?:    string
  city:      string
  state:     string
  pincode:   string
  lat?:      number
  lng?:      number
  isPrimary?: boolean
}

export interface UpdateAddressDto {
  line1?:   string
  line2?:   string
  city?:    string
  state?:   string
  pincode?: string
  lat?:     number
  lng?:     number
}

export interface AddressResponseDto {
  id:        string
  userId:    string
  line1:     string
  line2:     string | null
  city:      string
  state:     string
  pincode:   string
  lat:       number | null
  lng:       number | null
  isPrimary: boolean
}
