import { Router } from 'express'
import { seedCategories } from '../../infrastructure/database/seed/category.seed'
import { prisma } from '../../infrastructure/config/prisma'
import { verifyInternalSecret } from '../middlewares'

const router = Router()

router.post('/categories', async (_req, res, next) => {
  try {
    const seededCount = await seedCategories(prisma)

    res.status(200).json({
      success: true,
      message: 'Categories seeded successfully',
      count: seededCount,
    })
  } catch (error) {
    next(error)
  }
})

export default router
