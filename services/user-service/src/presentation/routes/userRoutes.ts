import { Router } from 'express'
import { UserController }    from '../controllers/UserController'
import { AddressController } from '../controllers/AddressController'
import { extractUser }       from '../middlewares/index'
import {
  updateProfileValidation,
  createAddressValidation,
  updateAddressValidation,
  validateRequest,
} from '../middlewares/validateRequest'

const router = Router()

// ── Profile routes ────────────────────────────────────────
// GET  /users/me         → get own profile + addresses
router.get('/me', extractUser, UserController.getMe)

// GET  /users/:id        → get any user by ID (used by other services)
router.get('/:id', UserController.getById)

// PATCH /users/me        → update own profile
router.patch(
  '/me',
  extractUser,
  updateProfileValidation,
  validateRequest,
  UserController.updateMe
)

// ── Address routes ────────────────────────────────────────
// GET    /users/me/addresses          → list all addresses
router.get('/me/addresses', extractUser, AddressController.getAll)

// POST   /users/me/addresses          → add new address
router.post(
  '/me/addresses',
  extractUser,
  createAddressValidation,
  validateRequest,
  AddressController.create
)

// PATCH  /users/me/addresses/:id      → update an address
router.patch(
  '/me/addresses/:id',
  extractUser,
  updateAddressValidation,
  validateRequest,
  AddressController.update
)

// PATCH  /users/me/addresses/:id/primary  → set as primary
router.patch('/me/addresses/:id/primary', extractUser, AddressController.setPrimary)

// DELETE /users/me/addresses/:id      → delete an address
router.delete('/me/addresses/:id', extractUser, AddressController.remove)

export default router
