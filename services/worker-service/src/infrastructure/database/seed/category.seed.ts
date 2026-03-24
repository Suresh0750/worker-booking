import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'
import { v4 as uuidv4 } from 'uuid';

export const categories = [
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
  ] as const

export const seedCategories = async (prisma: PrismaClient): Promise<number> => {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: {
        id: uuidv4(),
        name: category.name,
        slug: category.slug,
      },
    })
  }

  return categories.length
}