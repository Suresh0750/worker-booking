import { z } from 'zod'

export const locationQuerySchema = z.object({
  searchKey: z.enum(['state', 'city', 'pincode']),
  search: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
})

export type LocationQueryInput = z.infer<typeof locationQuerySchema>