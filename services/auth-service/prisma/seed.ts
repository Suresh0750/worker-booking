import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding auth_db...')

  const adminHash  = await bcrypt.hash('Admin@1234', 12)
  const userHash   = await bcrypt.hash('User@1234', 12)
  const workerHash = await bcrypt.hash('Worker@1234', 12)

  await prisma.user.upsert({
    where:  { email: 'admin@workerapp.com' },
    update: {},
    create: { email: 'admin@workerapp.com', passwordHash: adminHash, role: 'ADMIN' },
  })

  await prisma.user.upsert({
    where:  { email: 'user@workerapp.com' },
    update: {},
    create: { email: 'user@workerapp.com', passwordHash: userHash, role: 'USER' },
  })

  await prisma.user.upsert({
    where:  { email: 'worker@workerapp.com' },
    update: {},
    create: { email: 'worker@workerapp.com', passwordHash: workerHash, role: 'WORKER' },
  })

  console.log('Seed complete.')
  console.log('  admin@workerapp.com   / Admin@1234')
  console.log('  user@workerapp.com    / User@1234')
  console.log('  worker@workerapp.com  / Worker@1234')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
