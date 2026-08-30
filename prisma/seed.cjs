const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { username: 'admin' }
  })

  if (!existingAdmin) {
    console.log(' Creating default admin user...')
    
    // Hash the default password
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    await prisma.user.create({
      data: {
        name: 'Administrator',
        username: 'admin',
        password: hashedPassword,
        role: 'ADMIN',
        active: true
      }
    })
    
    console.log(' Default admin user created!')
    console.log('   Username: admin')
    console.log('   Password: admin123')
    console.log('   Please change these credentials after first login!')
  } else {
    console.log('Admin user already exists, skipping creation...')
  }

  // Check if any categories exist
  const categoriesCount = await prisma.category.count()
  if (categoriesCount === 0) {
    console.log('Creating default categories...')
    
    await prisma.category.createMany({
      data: [
        { name: 'Electronics' },
        { name: 'Food & Beverages' },
        { name: 'Clothing' },
        { name: 'Accessories' },
        { name: 'Books' }
      ]
    })
    
    console.log('Default categories created!')
  }

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })