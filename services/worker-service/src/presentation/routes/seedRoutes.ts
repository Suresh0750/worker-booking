import { Router } from 'express'
import { HttpStatus } from '../../domain/enums/HttpStatus'
import { seedCategories } from '../../infrastructure/database/seed/category.seed'
import { prisma } from '../../infrastructure/config/prisma'
import { verifyInternalSecret } from '../middlewares'

const router = Router()

router.post('/categories', async (_req, res, next) => {
  try {
    const seededCount = await seedCategories(prisma)

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Categories seeded successfully',
      count: seededCount,
    })
  } catch (error) {
    next(error)
  }
})

export default router
