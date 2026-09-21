import { z } from 'zod'

// ── Body schemas ──────────────────────────────────────────
export const uploadMediaSchema = z.object({
  caption: z.string().max(200, 'Caption max 200 characters').optional(),
})

// ── Params schemas ────────────────────────────────────────
export const idParamsSchema = z.object({
  id: z.string().uuid('Valid id is required'),
})

// ── Inferred request types ────────────────────────────────
export type UploadMediaRequestType = z.infer<typeof uploadMediaSchema>
export type IdParamsType           = z.infer<typeof idParamsSchema>
