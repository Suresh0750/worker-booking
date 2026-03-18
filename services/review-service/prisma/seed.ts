import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding review_db...')

  // Sample review — uses seed IDs from booking seed
  await prisma.review.upsert({
    where:  { bookingId: 'seed-booking-001' },
    update: {},
    create: {
      bookingId:  'seed-booking-001',
      workerId:   'seed-worker-001',
      userId:     'seed-user-001',
      userName:   'Ravi Kumar',
      workerName: 'Suresh Carpenter',
      rating:     5,
      comment:    'Excellent work! Suresh built the wardrobe exactly as I described. Very professional, clean work, and finished on time. Highly recommend!',
    },
  })

  console.log('✓ Sample review seeded')
  console.log('\nReview details:')
  console.log('  Worker:  seed-worker-001 (Suresh Carpenter)')
  console.log('  Rating:  5 stars')
  console.log('  Booking: seed-booking-001')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
