import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding user_db...')

  // These IDs must match the UUIDs created in auth_db seed
  // In real flow, Auth Service creates these via /internal/users
  const users = [
    {
      id:    'seed-user-001',
      email: 'user@workerapp.com',
      role:  'USER' as const,
      name:  'Ravi Kumar',
      phone: '9876543210',
    },
    {
      id:    'seed-worker-001',
      email: 'worker@workerapp.com',
      role:  'WORKER' as const,
      name:  'Suresh Carpenter',
      phone: '9876543211',
    },
  ]

  for (const u of users) {
    await prisma.user.upsert({
      where:  { email: u.email },
      update: {},
      create: u,
    })
  }

  // Add a sample address for the test user
  await prisma.address.upsert({
    where: { id: 'seed-address-001' },
    update: {},
    create: {
      id:        'seed-address-001',
      userId:    'seed-user-001',
      line1:     '42 Anna Nagar Main Road',
      line2:     'Near Big Bazaar',
      city:      'Chennai',
      state:     'Tamil Nadu',
      pincode:   '600040',
      lat:       13.0827,
      lng:       80.2707,
      isPrimary: true,
    },
  })

  console.log('Seed complete.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
