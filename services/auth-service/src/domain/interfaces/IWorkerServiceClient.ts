export interface CreateWorkerProfilePayload {
  userId: string
  email:  string
  name?:            string | null
  phone?:           string | null
  avatar?:          string | null
  bio?:             string | null
  experienceYears?: number
  availability?:    'AVAILABLE' | 'BUSY' | 'UNAVAILABLE'
}

export interface IWorkerServiceClient {
  createWorkerProfile(payload: CreateWorkerProfilePayload): Promise<void>
}
