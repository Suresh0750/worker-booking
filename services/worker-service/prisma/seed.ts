
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding categories and services...')

  // =========================
  // Categories
  // =========================

  const categories = [
    {
      id: 'cat-carpentry',
      name: 'Carpentry',
      slug: 'carpentry',
      description: 'Furniture, doors, woodwork and carpentry services',
      icon: 'carpentry',
      isActive: true,
      sortOrder: 1,
    },
    {
      id: 'cat-plumbing',
      name: 'Plumbing',
      slug: 'plumbing',
      description: 'Plumbing repair, installation and maintenance services',
      icon: 'plumbing',
      isActive: true,
      sortOrder: 2,
    },
    {
      id: 'cat-electrical',
      name: 'Electrical',
      slug: 'electrical',
      description: 'Electrical repair, installation and maintenance services',
      icon: 'electrical',
      isActive: true,
      sortOrder: 3,
    },
    {
      id: 'cat-cleaning',
      name: 'Cleaning',
      slug: 'cleaning',
      description: 'Home, office and deep cleaning services',
      icon: 'cleaning',
      isActive: true,
      sortOrder: 4,
    },
    {
      id: 'cat-painting',
      name: 'Painting',
      slug: 'painting',
      description: 'Interior, exterior and wall painting services',
      icon: 'painting',
      isActive: true,
      sortOrder: 5,
    },
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: {
        id: category.id,
      },
      update: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        icon: category.icon,
        isActive: category.isActive,
        sortOrder: category.sortOrder,
      },
      create: category,
    })
  }

  // =========================
  // Services
  // =========================

  const services = [
    // Carpentry
    {
      id: 'service-furniture-repair',
      categoryId: 'cat-carpentry',
      name: 'Furniture Repair',
      slug: 'furniture-repair',
      description: 'Repair and maintenance of wooden furniture',
      isActive: true,
    },
    {
      id: 'service-door-installation',
      categoryId: 'cat-carpentry',
      name: 'Door Installation',
      slug: 'door-installation',
      description: 'Installation and replacement of wooden doors',
      isActive: true,
    },
    {
      id: 'service-wood-polishing',
      categoryId: 'cat-carpentry',
      name: 'Wood Polishing',
      slug: 'wood-polishing',
      description: 'Wood furniture and surface polishing',
      isActive: true,
    },

    // Plumbing
    {
      id: 'service-pipe-repair',
      categoryId: 'cat-plumbing',
      name: 'Pipe Repair',
      slug: 'pipe-repair',
      description: 'Repair of leaking and damaged water pipes',
      isActive: true,
    },
    {
      id: 'service-tap-repair',
      categoryId: 'cat-plumbing',
      name: 'Tap Repair',
      slug: 'tap-repair',
      description: 'Repair and replacement of taps and faucets',
      isActive: true,
    },
    {
      id: 'service-bathroom-plumbing',
      categoryId: 'cat-plumbing',
      name: 'Bathroom Plumbing',
      slug: 'bathroom-plumbing',
      description: 'Bathroom plumbing installation and repair',
      isActive: true,
    },

    // Electrical
    {
      id: 'service-fan-installation',
      categoryId: 'cat-electrical',
      name: 'Fan Installation',
      slug: 'fan-installation',
      description: 'Installation and replacement of ceiling and wall fans',
      isActive: true,
    },
    {
      id: 'service-switch-repair',
      categoryId: 'cat-electrical',
      name: 'Switch Repair',
      slug: 'switch-repair',
      description: 'Repair and replacement of electrical switches',
      isActive: true,
    },
    {
      id: 'service-house-wiring',
      categoryId: 'cat-electrical',
      name: 'House Wiring',
      slug: 'house-wiring',
      description: 'Electrical wiring installation and maintenance',
      isActive: true,
    },

    // Cleaning
    {
      id: 'service-home-cleaning',
      categoryId: 'cat-cleaning',
      name: 'Home Cleaning',
      slug: 'home-cleaning',
      description: 'General home cleaning services',
      isActive: true,
    },
    {
      id: 'service-deep-cleaning',
      categoryId: 'cat-cleaning',
      name: 'Deep Cleaning',
      slug: 'deep-cleaning',
      description: 'Detailed deep cleaning for homes and apartments',
      isActive: true,
    },
    {
      id: 'service-office-cleaning',
      categoryId: 'cat-cleaning',
      name: 'Office Cleaning',
      slug: 'office-cleaning',
      description: 'Office and workplace cleaning services',
      isActive: true,
    },

    // Painting
    {
      id: 'service-wall-painting',
      categoryId: 'cat-painting',
      name: 'Wall Painting',
      slug: 'wall-painting',
      description: 'Interior and exterior wall painting',
      isActive: true,
    },
    {
      id: 'service-house-painting',
      categoryId: 'cat-painting',
      name: 'House Painting',
      slug: 'house-painting',
      description: 'Complete house painting services',
      isActive: true,
    },
  ]

  for (const service of services) {
    await prisma.service.upsert({
      where: {
        id: service.id,
      },
      update: {
        categoryId: service.categoryId,
        name: service.name,
        slug: service.slug,
        description: service.description,
        isActive: service.isActive,
      },
      create: service,
    })
  }

  console.log('Category and service seed completed successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
