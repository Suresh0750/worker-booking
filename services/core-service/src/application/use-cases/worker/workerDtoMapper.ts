import { WorkerFullEntity } from '@domain/entities/Worker'
import { WorkerProfileDto } from '../../dtos/WorkerDto'

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
    addresses:       w.addresses.map((a) => ({
      id:        a.id,
      line1:     a.line1,
      line2:     a.line2,
      city:      a.city,
      state:     a.state,
      pincode:   a.pincode,
      lat:       a.lat !== null ? Number(a.lat) : null,
      lng:       a.lng !== null ? Number(a.lng) : null,
      label:     a.label,
      isPrimary: a.isPrimary,
    })),
  }
}
