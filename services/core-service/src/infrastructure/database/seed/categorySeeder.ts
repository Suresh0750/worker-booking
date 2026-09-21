import { PrismaClient } from '@prisma/client'

const CATEGORIES = [
  { id: 'cat-carpentry',  name: 'Carpentry',  slug: 'carpentry',  description: 'Furniture, doors, woodwork',         icon: 'carpentry',   sortOrder: 1 },
  { id: 'cat-plumbing',   name: 'Plumbing',   slug: 'plumbing',   description: 'Plumbing repair and installation',   icon: 'plumbing',    sortOrder: 2 },
  { id: 'cat-electrical', name: 'Electrical', slug: 'electrical', description: 'Electrical repair and installation', icon: 'electrical',  sortOrder: 3 },
  { id: 'cat-cleaning',   name: 'Cleaning',   slug: 'cleaning',   description: 'Home, office and deep cleaning',     icon: 'cleaning',    sortOrder: 4 },
  { id: 'cat-painting',   name: 'Painting',   slug: 'painting',   description: 'Interior and exterior painting',     icon: 'painting',    sortOrder: 5 },
  { id: 'cat-ac-repair',  name: 'AC Repair',  slug: 'ac-repair',  description: 'AC servicing and repair',            icon: 'ac-repair',   sortOrder: 6 },
]

const SERVICES = [
  { id: 'svc-furniture-repair',  categoryId: 'cat-carpentry',  name: 'Furniture Repair',   slug: 'furniture-repair',   description: 'Repair and maintenance of wooden furniture' },
  { id: 'svc-door-installation', categoryId: 'cat-carpentry',  name: 'Door Installation',  slug: 'door-installation',  description: 'Installation and replacement of wooden doors' },
  { id: 'svc-wood-polishing',    categoryId: 'cat-carpentry',  name: 'Wood Polishing',     slug: 'wood-polishing',     description: 'Wood furniture and surface polishing' },
  { id: 'svc-pipe-repair',       categoryId: 'cat-plumbing',   name: 'Pipe Repair',        slug: 'pipe-repair',        description: 'Repair of leaking and damaged pipes' },
  { id: 'svc-tap-repair',        categoryId: 'cat-plumbing',   name: 'Tap Repair',         slug: 'tap-repair',         description: 'Repair and replacement of taps and faucets' },
  { id: 'svc-bathroom-plumbing', categoryId: 'cat-plumbing',   name: 'Bathroom Plumbing',  slug: 'bathroom-plumbing',  description: 'Bathroom plumbing installation and repair' },
  { id: 'svc-fan-installation',  categoryId: 'cat-electrical', name: 'Fan Installation',   slug: 'fan-installation',   description: 'Installation and replacement of fans' },
  { id: 'svc-switch-repair',     categoryId: 'cat-electrical', name: 'Switch Repair',      slug: 'switch-repair',      description: 'Repair and replacement of switches' },
  { id: 'svc-house-wiring',      categoryId: 'cat-electrical', name: 'House Wiring',       slug: 'house-wiring',       description: 'Electrical wiring installation and maintenance' },
  { id: 'svc-home-cleaning',     categoryId: 'cat-cleaning',   name: 'Home Cleaning',      slug: 'home-cleaning',      description: 'General home cleaning services' },
  { id: 'svc-deep-cleaning',     categoryId: 'cat-cleaning',   name: 'Deep Cleaning',      slug: 'deep-cleaning',      description: 'Detailed deep cleaning for homes' },
  { id: 'svc-office-cleaning',   categoryId: 'cat-cleaning',   name: 'Office Cleaning',    slug: 'office-cleaning',    description: 'Office and workplace cleaning' },
  { id: 'svc-wall-painting',     categoryId: 'cat-painting',   name: 'Wall Painting',      slug: 'wall-painting',      description: 'Interior and exterior wall painting' },
  { id: 'svc-house-painting',    categoryId: 'cat-painting',   name: 'House Painting',     slug: 'house-painting',     description: 'Complete house painting services' },
  { id: 'svc-ac-service',        categoryId: 'cat-ac-repair',  name: 'AC Service',         slug: 'ac-service',         description: 'Regular AC servicing and cleaning' },
  { id: 'svc-ac-installation',   categoryId: 'cat-ac-repair',  name: 'AC Installation',    slug: 'ac-installation',    description: 'AC unit installation and setup' },
]

export async function main(prisma: PrismaClient): Promise<number> {
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where:  { id: cat.id },
      update: { name: cat.name, slug: cat.slug, description: cat.description, icon: cat.icon, sortOrder: cat.sortOrder },
      create: { ...cat, isActive: true },
    })
  }
  for (const svc of SERVICES) {
    await prisma.service.upsert({
      where:  { id: svc.id },
      update: { name: svc.name, slug: svc.slug, description: svc.description, categoryId: svc.categoryId },
      create: { ...svc, isActive: true },
    })
  }
  return CATEGORIES.length + SERVICES.length
}
