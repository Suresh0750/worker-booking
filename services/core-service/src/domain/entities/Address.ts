// Single address entity — used by customers and workers alike
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
  label:     string | null
  isPrimary: boolean
  createdAt: Date
  updatedAt: Date
}
