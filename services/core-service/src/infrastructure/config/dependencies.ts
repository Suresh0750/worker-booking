/**
 * Dependency wiring — composes all use cases by injecting repository singletons.
 * Controllers import pre-built use-case instances from here.
 * Nothing in the domain or application layer touches this file.
 */

// ── Repositories (singletons) ─────────────────────────────
import authRepo       from '../repositories/PrismaAuthRepository'
import otpRepo        from '../repositories/PrismaOtpRepository'
import userRepo       from '../repositories/PrismaUserRepository'
import addressRepo    from '../repositories/PrismaAddressRepository'
import workerRepo     from '../repositories/PrismaWorkerRepository'
import portfolioRepo  from '../repositories/PrismaPortfolioRepository'
import documentRepo   from '../repositories/PrismaWorkerDocumentRepository'
import otpDelivery    from '../services/OtpDeliveryService'

export { default as categoryRepo } from '../repositories/PrismaCategoryRepository'
import categoryRepoInstance from '../repositories/PrismaCategoryRepository'

// ── Auth use cases ────────────────────────────────────────
import { RegisterUser }       from '@application/use-cases/auth/RegisterUser'
import { LoginUser }          from '@application/use-cases/auth/LoginUser'
import { RefreshAccessToken } from '@application/use-cases/auth/RefreshAccessToken'
import { LogoutUser }         from '@application/use-cases/auth/LogoutUser'
import { OtpUseCase }         from '@application/use-cases/auth/OtpUseCase'

export const registerUser       = new RegisterUser(authRepo, otpRepo, workerRepo)
export const loginUser          = new LoginUser(authRepo)
export const refreshAccessToken = new RefreshAccessToken(authRepo)
export const logoutUser         = new LogoutUser(authRepo)
export const otpUseCase         = new OtpUseCase(authRepo, otpRepo, otpDelivery)

// ── User use cases ────────────────────────────────────────
import { GetUserProfile }    from '@application/use-cases/user/GetUserProfile'
import { UpdateUserProfile } from '@application/use-cases/user/UpdateUserProfile'

export const getUserProfile    = new GetUserProfile(userRepo, addressRepo)
export const updateUserProfile = new UpdateUserProfile(userRepo)

// ── Address use cases ─────────────────────────────────────
import {
  AddAddress,
  GetAddresses,
  UpdateAddress,
  SetPrimaryAddress,
  DeleteAddress,
} from '@application/use-cases/address/AddressUseCases'

export const addAddress        = new AddAddress(addressRepo, userRepo)
export const getAddresses      = new GetAddresses(addressRepo)
export const updateAddress     = new UpdateAddress(addressRepo)
export const setPrimaryAddress = new SetPrimaryAddress(addressRepo)
export const deleteAddress     = new DeleteAddress(addressRepo)

// ── Worker use cases ──────────────────────────────────────
import { CreateWorkerProfile }                        from '@application/use-cases/worker/CreateWorkerProfile'
import { GetWorkerProfile }                           from '@application/use-cases/worker/GetWorkerProfile'
import { UpdateWorkerProfile, SetWorkerCategories }   from '@application/use-cases/worker/UpdateWorkerProfile'
import { SearchWorkers }                              from '@application/use-cases/worker/SearchWorkers'
import { UpdateWorkerRating }                         from '@application/use-cases/worker/UpdateWorkerRating'
import { AddPortfolioItem, DeletePortfolioItem, GetPortfolio } from '@application/use-cases/worker/PortfolioUseCases'
import {
  UploadWorkerDocument,
  GetWorkerDocuments,
  ReviewWorkerDocument,
  DeleteWorkerDocument,
} from '@application/use-cases/worker/WorkerDocumentUseCases'

export const createWorkerProfile  = new CreateWorkerProfile(workerRepo)
export const getWorkerProfile     = new GetWorkerProfile(workerRepo)
export const updateWorkerProfile  = new UpdateWorkerProfile(workerRepo)
export const setWorkerCategories  = new SetWorkerCategories(categoryRepoInstance)
export const searchWorkers        = new SearchWorkers(workerRepo)
export const updateWorkerRating   = new UpdateWorkerRating(workerRepo)

export const addPortfolioItem     = new AddPortfolioItem(portfolioRepo)
export const deletePortfolioItem  = new DeletePortfolioItem(portfolioRepo, workerRepo)
export const getPortfolio         = new GetPortfolio(portfolioRepo)

export const uploadWorkerDocument  = new UploadWorkerDocument(documentRepo, workerRepo)
export const getWorkerDocuments    = new GetWorkerDocuments(documentRepo, workerRepo)
export const reviewWorkerDocument  = new ReviewWorkerDocument(documentRepo)
export const deleteWorkerDocument  = new DeleteWorkerDocument(documentRepo, workerRepo)
