import { WorkerAddressView, WorkerFullEntity } from '@domain/entities/Worker'
import { AddressEntity } from '@domain/entities/Address'
import { WorkerAddressDto, WorkerProfileDto } from '../../dtos/WorkerDto'

// ── Shared address shape picker — works for both AddressEntity and WorkerAddressView ──
function pickAddressDto(a: WorkerAddressView): WorkerAddressDto {
  return {
    id:        a.id,
    line1:     a.line1,
    line2:     a.line2,
    city:      a.city,
    state:     a.state,
    pincode:   a.pincode,
    lat:       a.lat,
    lng:       a.lng,
    label:     a.label,
    isPrimary: a.isPrimary,
  }
}

// Centralised mapper — all worker use cases share this
export function toWorkerProfileDto(w: WorkerFullEntity): WorkerProfileDto {
  return {
    id:              w.id,
    userId:          w.userId,
    fullName:        w.fullName,
    email:           w.email,
    phone:           w.phone,
    profileImage:    w.profileImage,
    bio:             w.bio,
    experienceYears: w.experienceYears,
    avgRating:       Number(w.avgRating),
    totalReviews:    w.totalReviews,
    availability:    w.availability,
    isVerified:      w.isVerified,
    categories:      w.categories,
    portfolios:      w.portfolios,
    documents:       w.documents,
    addresses:       w.addresses.map(pickAddressDto),
  }
}

/**
 * Maps a single AddressEntity → WorkerAddressDto.
 * Strips internal fields (userId, createdAt, updatedAt) before sending to client.
 */
export function toWorkerAddressDto(a: AddressEntity): WorkerAddressDto {
  return pickAddressDto(a)
}

/** Maps an array of AddressEntity → WorkerAddressDto[] */
export function toGetWorkerAddressDto(addresses: AddressEntity[]): WorkerAddressDto[] {
  return addresses.map(toWorkerAddressDto)
}