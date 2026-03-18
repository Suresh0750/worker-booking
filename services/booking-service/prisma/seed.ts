import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding booking_db...')

  // Sample booking — uses seed IDs from auth + worker seeds
  await prisma.booking.upsert({
    where:  { id: 'seed-booking-001' },
    update: {},
    create: {
      id:           'seed-booking-001',
      userId:       'seed-user-001',
      workerId:     'seed-worker-001',
      categoryId:   'seed-category-001',
      userName:     'Ravi Kumar',
      workerName:   'Suresh Carpenter',
      categoryName: 'Carpenter',
      description:  'Need a custom wardrobe built for my bedroom, 6x4 feet with sliding doors.',
      address:      '42 Anna Nagar Main Road, Near Big Bazaar',
      city:         'Chennai',
      lat:          13.0827,
      lng:          80.2707,
      status:       'COMPLETED',
      priceAgreed:  3500,
      statusLogs: {
        createMany: {
          data: [
            { fromStatus: null,        toStatus: 'PENDING',     changedBy: 'seed-user-001',   note: 'Booking created' },
            { fromStatus: 'PENDING',   toStatus: 'ACCEPTED',    changedBy: 'seed-worker-001', note: 'Worker accepted' },
            { fromStatus: 'ACCEPTED',  toStatus: 'IN_PROGRESS', changedBy: 'seed-worker-001', note: 'Work started' },
            { fromStatus: 'IN_PROGRESS', toStatus: 'COMPLETED', changedBy: 'seed-worker-001', note: 'Work completed' },
          ],
        },
      },
      messages: {
        createMany: {
          data: [
            { senderId: 'seed-user-001',   senderRole: 'USER',   content: 'Hi, I need a wardrobe built. Are you available this weekend?' },
            { senderId: 'seed-worker-001', senderRole: 'WORKER', content: 'Yes I am available Saturday. Material cost will be around ₹2000, my charge is ₹1500.' },
            { senderId: 'seed-user-001',   senderRole: 'USER',   content: 'Sounds good, ₹3500 total. Please come at 10am.' },
            { senderId: 'seed-worker-001', senderRole: 'WORKER', content: 'Confirmed. See you Saturday at 10am.' },
          ],
        },
      },
    },
  })

  console.log('✓ Sample booking seeded with status logs and messages')
  console.log('\nBooking status flow:')
  console.log('  PENDING → ACCEPTED → IN_PROGRESS → COMPLETED')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
