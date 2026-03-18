import { Router } from 'express'
import { UserController }       from '../controllers/UserController'
import { verifyInternalSecret } from '../middlewares/index'

const router = Router()

// POST /internal/users
// Called by Auth Service after register with:
// { eventType: "create_profile", data: { userId, email, role } }
// When Kafka arrives → this becomes a Kafka consumer of "user.registered" topic
router.post('/users', verifyInternalSecret, UserController.createProfile)

export default router
