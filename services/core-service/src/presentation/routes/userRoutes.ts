import { Router } from 'express'
import { UserController }    from '../controllers/UserController'
import { AddressController } from '../controllers/AddressController'
import { extractUser }       from '../middlewares/extractUser'
import { validateRequest }   from '../middlewares/validateRequest'
import {
  updateProfileSchema,
  createAddressSchema,
  updateAddressSchema,
  idParamsSchema,
} from '@application/schemas/UserSchemas'

const router = Router()

// ── Profile ───────────────────────────────────────────────
// GET  /users/me
router.get('/me', extractUser, UserController.getMe)

// GET  /users/:id  — used by other internal services
router.get('/:id', validateRequest({ params: idParamsSchema }), UserController.getById)

// PATCH /users/me
router.patch('/me', extractUser, validateRequest({ body: updateProfileSchema }), UserController.updateMe)

// ── Addresses ─────────────────────────────────────────────
// GET    /users/me/addresses
router.get('/me/addresses', extractUser, AddressController.getAll)

// POST   /users/me/addresses
router.post('/me/addresses', extractUser, validateRequest({ body: createAddressSchema }), AddressController.create)

// PATCH  /users/me/addresses/:id
router.patch(
  '/me/addresses/:id',
  extractUser,
  validateRequest({ params: idParamsSchema, body: updateAddressSchema }),
  AddressController.update,
)

// PATCH  /users/me/addresses/:id/primary
router.patch(
  '/me/addresses/:id/primary',
  extractUser,
  validateRequest({ params: idParamsSchema }),
  AddressController.setPrimary,
)

// DELETE /users/me/addresses/:id
router.delete(
  '/me/addresses/:id',
  extractUser,
  validateRequest({ params: idParamsSchema }),
  AddressController.remove,
)

export default router
