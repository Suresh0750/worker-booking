import { Router } from 'express'
import { UserController }    from '../controllers/UserController'
import { AddressController } from '../controllers/AddressController'
import { authenticateJwt }   from '../middlewares/authenticateJwt'
import { validateRequest }   from '../middlewares/validateRequest'
import { avatarUpload }      from '@infrastructure/config/upload'
import {
  updateProfileSchema,
  createAddressSchema,
  updateAddressSchema,
  idParamsSchema,
} from '@application/schemas/UserSchemas'

const router = Router()

// ── Profile ───────────────────────────────────────────────
// GET  /users/me
router.get('/me', authenticateJwt, UserController.getMe)

// GET  /users/:id  — used by other internal services
router.get('/:id', validateRequest({ params: idParamsSchema }), UserController.getById)

// PATCH /users/me
router.patch('/me', authenticateJwt, validateRequest({ body: updateProfileSchema }), UserController.updateMe)

// PATCH /users/me/avatar — update profile image
router.patch('/me/avatar', authenticateJwt, avatarUpload.single('image'), UserController.updateAvatar)

// ── Addresses ─────────────────────────────────────────────
// GET    /users/me/addresses
router.get('/me/addresses', authenticateJwt, AddressController.getAll)

// POST   /users/me/addresses
router.post('/me/addresses', authenticateJwt, validateRequest({ body: createAddressSchema }), AddressController.create)

// PATCH  /users/me/addresses/:id
router.patch(
  '/me/addresses/:id',
  authenticateJwt,
  validateRequest({ params: idParamsSchema, body: updateAddressSchema }),
  AddressController.update,
)

// PATCH  /users/me/addresses/:id/primary
router.patch(
  '/me/addresses/:id/primary',
  authenticateJwt,
  validateRequest({ params: idParamsSchema }),
  AddressController.setPrimary,
)

// DELETE /users/me/addresses/:id
router.delete(
  '/me/addresses/:id',
  authenticateJwt,
  validateRequest({ params: idParamsSchema }),
  AddressController.remove,
)

export default router
