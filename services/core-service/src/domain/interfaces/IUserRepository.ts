import { UserProfileEntity } from '../entities/User'

export interface CreateUserProfileInput {
  id:       string   // same UUID issued by auth layer
  email:    string
  fullName: string
  phone:    string
  role:     string
}

export interface UpdateUserProfileInput {
  fullName?:      string
  phone?:         string
  secondaryPhone?: string
  gender?:        string
  dob?:           Date
  profileImage?:  string
}

export interface IUserRepository {
  findById(id: string): Promise<UserProfileEntity | null>
  findByEmail(email: string): Promise<UserProfileEntity | null>
  update(id: string, data: UpdateUserProfileInput): Promise<UserProfileEntity>
  deactivate(id: string): Promise<void>
}
