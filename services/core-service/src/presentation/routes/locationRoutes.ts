import { Router } from 'express'
import { LocationController } from '../controllers/LocationController'
import { validateRequest } from '../middlewares/validateRequest'
import { locationQuerySchema } from '@application/schemas/LocationSchemas'

const router = Router()

router.get('/', validateRequest({ query: locationQuerySchema }), LocationController.search)

export default router