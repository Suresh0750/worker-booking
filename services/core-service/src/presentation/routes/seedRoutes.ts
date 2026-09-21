import { Router } from 'express'
import { HttpStatus } from '@domain/enums/HttpStatus'
import { prisma } from '@infrastructure/config/prisma'
import { verifyInternalSecret } from '../middlewares/verifyInternalSecret'

const router = Router()

// POST /seed/categories — seeds categories + services (idempotent via upsert)
// Protected by internal secret so it can't be triggered publicly
router.post('/categories', verifyInternalSecret, async (_req, res, next) => {
  try {
    const { main } = await import('@infrastructure/database/seed/categorySeeder')
    const count = await main(prisma)
    res.status(HttpStatus.OK).json({ success: true, message: 'Categories seeded', count })
  } catch (err) { next(err) }
})

export default router
