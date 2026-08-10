import { RegisterUser }       from '../application/use-cases/RegisterUser'
import { LoginUser }          from '../application/use-cases/LoginUser'
import { RefreshAccessToken } from '../application/use-cases/RefreshAccessToken'
import { LogoutUser }         from '../application/use-cases/LogoutUser'
import { Otp }               from '../application/use-cases/Otp'
import authRepo  from '../infrastructure/repositories/PrismaAuthRepository'
import otpRepo   from '../infrastructure/repositories/PrismaOtpRepository'
import otpDeliveryService from '../infrastructure/services/OtpDeliveryService'
import userServiceClient    from '../infrastructure/services/UserServiceClient'
import workerServiceClient   from '../infrastructure/services/WorkerServiceClient'


export const registerUser       = new RegisterUser(authRepo, userServiceClient, workerServiceClient, otpRepo)
export const loginUser          = new LoginUser(authRepo)
export const refreshAccessToken = new RefreshAccessToken(authRepo)
export const logoutUser         = new LogoutUser(authRepo)
export const otp = new Otp(authRepo, otpRepo, otpDeliveryService)

