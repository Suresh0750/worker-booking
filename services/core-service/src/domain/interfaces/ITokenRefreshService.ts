import { Request, Response } from 'express'

export interface RefreshedTokenPayload {
  userId: string
  role:   string
  email:  string
}

/**
 * ITokenRefreshService
 *
 * Abstracts the "silently refresh an expired access token" concern.
 * The middleware depends on this interface, not on any concrete implementation,
 * satisfying the Dependency-Inversion Principle.
 *
 * Returns the new token payload on success so the middleware can attach it to
 * `req` just like a freshly-verified access token would be.
 * Returns null when the refresh token is missing, expired, or invalid — the
 * caller is responsible for responding with 401 in that case.
 */
export interface ITokenRefreshService {
  /**
   * Attempt a silent token refresh.
   *
   * Side-effects on success:
   *   - Rotates the refresh-token DB record (delete old, insert new).
   *   - Writes the new refresh token into the httpOnly cookie on `res`.
   *   - Sets `x-new-access-token` response header with the new JWT so the
   *     client can update its in-memory copy without a round-trip.
   *
   * @returns RefreshedTokenPayload on success, null on any failure.
   */
  refresh(req: Request, res: Response): Promise<RefreshedTokenPayload | null>
}
