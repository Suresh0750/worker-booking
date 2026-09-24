import { WorkerFullEntity } from '@domain/entities/Worker'
import { WorkerAddressDto, WorkerProfileDto } from '../../dtos/WorkerDto'

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


export function toWorkerAddressDto(wA : WorkerAddressDto):WorkerAddressDto{
  return{
      id:        wA.id,
      line1:     wA.line1,
      line2:     wA.line2,
      city:      wA.city,
      state:     wA.state,
      pincode:   wA.pincode,
      lat:       wA.lat !== null ? Number(wA.lat) : null,
      lng:       wA.lng !== null ? Number(wA.lng) : null,
      label:     wA.label,
      isPrimary: wA.isPrimary,
    }
}


export function toGetWorkerAddressDto(wA : WorkerAddressDto[]):WorkerAddressDto[]{
  return wA.map((a)=>({
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
    }))
}