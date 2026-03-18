import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding media_db...')

  // Sample portfolio media records for the test worker
  const items = [
    {
      id:        'seed-media-001',
      ownerId:   'seed-worker-001',
      s3Key:     'images/seed-worker-001/wardrobe-001.jpg',
      cdnUrl:    'https://worker-app-media.s3.ap-south-1.amazonaws.com/images/seed-worker-001/wardrobe-001.jpg',
      fileName:  'wardrobe-001.jpg',
      mimeType:  'image/jpeg',
      sizeBytes: 245000,
      mediaType: 'IMAGE' as const,
      isAttached: true,
    },
    {
      id:        'seed-media-002',
      ownerId:   'seed-worker-001',
      s3Key:     'images/seed-worker-001/door-fitting-001.jpg',
      cdnUrl:    'https://worker-app-media.s3.ap-south-1.amazonaws.com/images/seed-worker-001/door-fitting-001.jpg',
      fileName:  'door-fitting-001.jpg',
      mimeType:  'image/jpeg',
      sizeBytes: 198000,
      mediaType: 'IMAGE' as const,
      isAttached: true,
    },
  ]

  for (const item of items) {
    await prisma.mediaFile.upsert({
      where:  { id: item.id },
      update: {},
      create: item,
    })
  }

  console.log(`✓ ${items.length} media records seeded for seed-worker-001`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
