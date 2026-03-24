import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding worker_db...')

  // ── Seed categories ───────────────────────────────────
  const categories = [
    { name: 'Carpenter',      slug: 'carpenter' },
    { name: 'Electrician',    slug: 'electrician' },
    { name: 'Plumber',        slug: 'plumber' },
    { name: 'Painter',        slug: 'painter' },
    { name: 'AC Repair',      slug: 'ac-repair' },
    { name: 'Welder',         slug: 'welder' },
    { name: 'Mason',          slug: 'mason' },
    { name: 'Tile Work',      slug: 'tile-work' },
    { name: 'Aluminium Work', slug: 'aluminium-work' },
    { name: 'Furniture',      slug: 'furniture' },
    { name: 'Bike Mechanic', slug: 'bike-mechanic' },
    { name: 'Car Mechanic',  slug: 'car-mechanic' },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where:  { slug: cat.slug },
      update: {},
      create: cat,
    })
  }

  console.log(`✓ ${categories.length} categories seeded`)

  // ── Seed a sample worker ──────────────────────────────
  const carpenter = await prisma.category.findUnique({ where: { slug: 'carpenter' } })

  await prisma.worker.upsert({
    where:  { email: 'worker@workerapp.com' },
    update: {},
    create: {
      id:              'seed-worker-001',
      email:           'worker@workerapp.com',
      name:            'Suresh Kumar',
      phone:           '9876543210',
      bio:             'Expert carpenter with 8 years of experience in custom furniture and door fitting.',
    },
  })

  // Add address for geo search
  await prisma.workerAddress.upsert({
    where: { id: 'seed-waddr-001' },
    update: {},
    create: {
      id:        'seed-waddr-001',
      workerId:  'seed-worker-001',
      line1:     '15 T Nagar 3rd Street',
      city:      'Chennai',
      state:     'Tamil Nadu',
      pincode:   '600017',
      lat:       13.0418,
      lng:       80.2341,
      isPrimary: true,
    },
  })

  // Assign carpenter category
  if (carpenter) {
    await prisma.workerCategory.upsert({
      where: {
        workerId_categoryId: {
          workerId:   'seed-worker-001',
          categoryId: carpenter.id,
        },
      },
      update: {},
      create: {
        workerId:   'seed-worker-001',
        categoryId: carpenter.id,
      },
    })
  }

  console.log('✓ Sample worker seeded')
  console.log('\nSeed complete.')
  console.log('Categories available:')
  categories.forEach((c) => console.log(`  • ${c.name}`))
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
