export interface CreateProfilePayload {
  userId: string
  email:  string
  role:   string
}

export interface IUserServiceClient {
  createProfile(payload: CreateProfilePayload): Promise<void>
}
