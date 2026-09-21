import { PrismaClient } from '@prisma/client'
import { main as seedCategories } from '../src/infrastructure/database/seed/categorySeeder'

const prisma = new PrismaClient()

seedCategories(prisma)
  .then((count) => console.log(`Seeded ${count} records successfully.`))
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
