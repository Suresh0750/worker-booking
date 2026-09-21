import { Role } from '@domain/entities/User'

export interface UserResponseDto {
  id:             string
  fullName:       string
  email:          string
  phone:          string
  secondaryPhone: string | null
  role:           Role
  gender:         string | null
  dob:            Date | null
  profileImage:   string | null
  isBlocked:      boolean
  createdAt:      Date
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
  label:     string | null
  isPrimary: boolean
}
