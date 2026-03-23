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

async function seedInstructors() {
  const instructorRole = await prisma.role.findUnique({
    where: { name: 'INSTRUCTOR' },
  });

  if (!instructorRole) {
    throw new Error(
      'INSTRUCTOR role not found. Make sure roles are seeded first.',
    );
  }

  const instructors = [
    {
      email: 'john.smith@lms.com',
      password: await bcrypt.hash('Instructor123!', 10),
      firstName: 'John',
      lastName: 'Smith',
      bio: 'Senior Full Stack Developer with 10+ years of experience in web development.',
    },
    {
      email: 'sarah.johnson@lms.com',
      password: await bcrypt.hash('Instructor123!', 10),
      firstName: 'Sarah',
      lastName: 'Johnson',
      bio: 'Data Science expert and machine learning enthusiast.',
    },
    {
      email: 'michael.chen@lms.com',
      password: await bcrypt.hash('Instructor123!', 10),
      firstName: 'Michael',
      lastName: 'Chen',
      bio: 'Mobile app developer specializing in iOS and Android development.',
    },
  ];

  const createdInstructors: { id: string }[] = [];
  for (const instructor of instructors) {
    const created = await prisma.user.upsert({
      where: { email: instructor.email },
      update: {},
      create: {
        email: instructor.email,
        password: instructor.password,
        firstName: instructor.firstName,
        lastName: instructor.lastName,
        bio: instructor.bio,
        roleId: instructorRole.id,
        isActive: true,
      },
    });
    createdInstructors.push({ id: created.id });
  }

  console.log('Instructors seeded successfully!');
  return createdInstructors;
}

async function seedCourses(instructors: any[]) {
  const webDevCategory = await prisma.category.findUnique({
    where: { name: 'Web Development' },
  });

  const dataScienceCategory = await prisma.category.findUnique({
    where: { name: 'Data Science' },
  });

  const mobileCategory = await prisma.category.findUnique({
    where: { name: 'Mobile Development' },
  });

  const courses = [
    {
      title: 'Complete React Developer Course',
      description:
        'Master React.js from scratch. Learn hooks, Redux, Next.js, and build real-world projects.',
      duration: 40,
      price: 49.99,
      isPublished: true,
      instructorId: instructors[0].id,
      categoryId: webDevCategory?.id,
      lessons: [
        {
          title: 'Introduction to React',
          description: 'Understanding React fundamentals',
          duration: 30,
          order: 1,
          isPublished: true,
        },
        {
          title: 'JSX and Components',
          description: 'Learning JSX syntax and component creation',
          duration: 45,
          order: 2,
          isPublished: true,
        },
        {
          title: 'React Hooks Deep Dive',
          description: 'Master useState, useEffect, and custom hooks',
          duration: 60,
          order: 3,
          isPublished: true,
        },
        {
          title: 'State Management with Redux',
          description: 'Learn Redux and Redux Toolkit',
          duration: 90,
          order: 4,
          isPublished: true,
        },
        {
          title: 'Building a Real Project',
          description: 'Create a complete React application',
          duration: 120,
          order: 5,
          isPublished: true,
        },
      ],
    },
    {
      title: 'JavaScript Fundamentals',
      description:
        'Learn JavaScript from the ground up. Perfect for beginners.',
      duration: 25,
      price: 0,
      isPublished: true,
      instructorId: instructors[0].id,
      categoryId: webDevCategory?.id,
      lessons: [
        {
          title: 'Getting Started with JavaScript',
          description: 'Introduction to JS and setting up environment',
          duration: 20,
          order: 1,
          isPublished: true,
        },
        {
          title: 'Variables and Data Types',
          description: 'Understanding let, const, and data types',
          duration: 35,
          order: 2,
          isPublished: true,
        },
        {
          title: 'Functions and Scope',
          description: 'Function declarations, expressions, and scope',
          duration: 45,
          order: 3,
          isPublished: true,
        },
      ],
    },
    {
      title: 'Python for Data Science',
      description:
        'Learn Python programming and data analysis with pandas, numpy, and matplotlib.',
      duration: 35,
      price: 59.99,
      isPublished: true,
      instructorId: instructors[1].id,
      categoryId: dataScienceCategory?.id,
      lessons: [
        {
          title: 'Python Basics',
          description: 'Introduction to Python syntax',
          duration: 30,
          order: 1,
          isPublished: true,
        },
        {
          title: 'Data Structures',
          description: 'Lists, dictionaries, tuples, and sets',
          duration: 45,
          order: 2,
          isPublished: true,
        },
        {
          title: 'NumPy Fundamentals',
          description: 'Working with numerical data',
          duration: 60,
          order: 3,
          isPublished: true,
        },
        {
          title: 'Pandas for Data Analysis',
          description: 'DataFrames and data manipulation',
          duration: 90,
          order: 4,
          isPublished: true,
        },
        {
          title: 'Data Visualization',
          description: 'Creating charts with matplotlib',
          duration: 60,
          order: 5,
          isPublished: true,
        },
      ],
    },
    {
      title: 'Machine Learning A-Z',
      description:
        'Complete machine learning course with Python. Build real AI projects.',
      duration: 50,
      price: 79.99,
      isPublished: true,
      instructorId: instructors[1].id,
      categoryId: dataScienceCategory?.id,
      lessons: [
        {
          title: 'Introduction to ML',
          description: 'What is machine learning?',
          duration: 25,
          order: 1,
          isPublished: true,
        },
        {
          title: 'Linear Regression',
          description: 'Building your first ML model',
          duration: 60,
          order: 2,
          isPublished: true,
        },
        {
          title: 'Classification Algorithms',
          description: 'Logistic regression and decision trees',
          duration: 75,
          order: 3,
          isPublished: true,
        },
        {
          title: 'Neural Networks',
          description: 'Introduction to deep learning',
          duration: 90,
          order: 4,
          isPublished: true,
        },
      ],
    },
    {
      title: 'Flutter Mobile Development',
      description:
        'Build beautiful cross-platform mobile apps with Flutter and Dart.',
      duration: 45,
      price: 69.99,
      isPublished: true,
      instructorId: instructors[2].id,
      categoryId: mobileCategory?.id,
      lessons: [
        {
          title: 'Getting Started with Flutter',
          description: 'Setting up Flutter environment',
          duration: 30,
          order: 1,
          isPublished: true,
        },
        {
          title: 'Dart Programming',
          description: 'Dart language fundamentals',
          duration: 45,
          order: 2,
          isPublished: true,
        },
        {
          title: 'Widgets Deep Dive',
          description: 'Understanding Flutter widgets',
          duration: 60,
          order: 3,
          isPublished: true,
        },
        {
          title: 'State Management',
          description: 'Provider, Riverpod, and Bloc',
          duration: 75,
          order: 4,
          isPublished: true,
        },
        {
          title: 'Building a Complete App',
          description: 'Create a production-ready mobile app',
          duration: 120,
          order: 5,
          isPublished: true,
        },
      ],
    },
    {
      title: 'iOS App Development with Swift',
      description:
        'Learn to build iOS apps from scratch using Swift and Xcode.',
      duration: 40,
      price: 64.99,
      isPublished: true,
      instructorId: instructors[2].id,
      categoryId: mobileCategory?.id,
      lessons: [
        {
          title: 'Introduction to Swift',
          description: 'Swift programming basics',
          duration: 35,
          order: 1,
          isPublished: true,
        },
        {
          title: 'Xcode Essentials',
          description: 'Working with Xcode IDE',
          duration: 40,
          order: 2,
          isPublished: true,
        },
        {
          title: 'UIKit Fundamentals',
          description: 'Building user interfaces',
          duration: 60,
          order: 3,
          isPublished: true,
        },
        {
          title: 'SwiftUI Introduction',
          description: 'Modern declarative UI',
          duration: 60,
          order: 4,
          isPublished: true,
        },
      ],
    },
  ];

  for (const courseData of courses) {
    const { lessons, ...courseInfo } = courseData;

    const course = await prisma.course.create({
      data: courseInfo,
    });

    // Create lessons for the course
    for (const lessonData of lessons) {
      await prisma.lesson.create({
        data: {
          ...lessonData,
          courseId: course.id,
          instructorId: course.instructorId,
        },
      });
    }

    console.log(
      `Course '${course.title}' seeded with ${lessons.length} lessons`,
    );
  }

  console.log('Courses seeded successfully!');
}

async function main() {
  try {
    await seedRoles();
    await seedCategories();
    await seedAdminUser();
    const instructors = await seedInstructors();
    await seedCourses(instructors);
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
