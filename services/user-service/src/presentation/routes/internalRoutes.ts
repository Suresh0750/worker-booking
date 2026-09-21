import { Router } from 'express'
import { UserController }       from '../controllers/UserController'
import { verifyInternalSecret } from '../middlewares/index'
import { validateRequest }      from '../middlewares/validateRequest'
import { createProfileEventSchema } from '../../application/schemas/UserSchemas'

const router = Router()

// POST /internal/users
// Called by Auth Service after register with:
// { eventType: "create_profile", data: { userId, email, role } }
// When Kafka arrives → this becomes a Kafka consumer of "user.registered" topic
router.post(
  '/users',
  verifyInternalSecret,
  validateRequest({ body: createProfileEventSchema }),
  UserController.createProfile
)

export default router
