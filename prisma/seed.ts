// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedRoles() {
  const roles = ['ADMIN', 'INSTRUCTOR', 'STUDENT'];

  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log('Roles seeded successfully!');
}

async function seedCategories() {
  const categories = [
    {
      name: 'Web Development',
      description:
        'Learn HTML, CSS, JavaScript, and modern frameworks like React, Vue, and Angular',
    },
    {
      name: 'Mobile Development',
      description:
        'Build iOS and Android apps with Swift, Kotlin, Flutter, and React Native',
    },
    {
      name: 'Data Science',
      description:
        'Master data analysis, machine learning, and artificial intelligence',
    },
    {
      name: 'Programming Languages',
      description: 'Learn Python, Java, C++, and other programming languages',
    },
    {
      name: 'Database Design',
      description: 'Understand SQL, NoSQL, database modeling, and optimization',
    },
    {
      name: 'DevOps',
      description: 'Learn CI/CD, Docker, Kubernetes, and cloud platforms',
    },
    {
      name: 'Cybersecurity',
      description:
        'Master network security, ethical hacking, and security best practices',
    },
    {
      name: 'Cloud Computing',
      description: 'AWS, Azure, Google Cloud Platform certification and skills',
    },
    {
      name: 'UI/UX Design',
      description:
        'Learn user interface design, user experience principles, and design tools',
    },
    {
      name: 'Business & Marketing',
      description:
        'Digital marketing, SEO, business strategy, and entrepreneurship',
    },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }

  console.log('Categories seeded successfully!');
}

async function seedAdminUser() {
  const adminEmail = 'admin@lms.com';
  const hashedPassword = await bcrypt.hash('Admin123!', 10); // default password

  // Get the ADMIN role
  const adminRole = await prisma.role.findUnique({
    where: { name: 'ADMIN' },
  });

  if (!adminRole)
    throw new Error('ADMIN role not found. Make sure roles are seeded first.');

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      roleId: adminRole.id,
      isActive: true,
    },
  });

  console.log('Admin user seeded successfully!');
}

async function main() {
  try {
    await seedRoles();
    await seedCategories();
    await seedAdminUser();
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
