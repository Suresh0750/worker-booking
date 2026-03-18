import { UserEntity } from '../entities/User'

export interface CreateUserInput {
  id:    string   // comes from auth-service — same UUID
  email: string
  role:  string
}

export interface UpdateUserInput {
  name?:   string
  phone?:  string
  avatar?: string
}

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>
  findByEmail(email: string): Promise<UserEntity | null>
  create(data: CreateUserInput): Promise<UserEntity>
  update(id: string, data: UpdateUserInput): Promise<UserEntity>
  deactivate(id: string): Promise<void>
}
