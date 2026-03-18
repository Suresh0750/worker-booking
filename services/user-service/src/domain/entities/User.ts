export type Role = 'USER' | 'WORKER' | 'ADMIN'

export interface UserEntity {
  id:        string
  email:     string
  name:      string | null
  phone:     string | null
  avatar:    string | null
  role:      Role
  isActive:  boolean
  createdAt: Date
  updatedAt: Date
}

export interface AddressEntity {
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
  createdAt: Date
  updatedAt: Date
}
