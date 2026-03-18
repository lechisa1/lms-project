import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CourseRepository {
  constructor(private prisma: PrismaService) {}

  //   async create(createCourseDto: CreateCourseDto, instructorId: string) {
  //     return this.prisma.course.create({
  //       data: {
  //         ...createCourseDto,
  //         instructorId,
  //       },
  //       include: {
  //         instructor: {
  //           select: {
  //             id: true,
  //             firstName: true,
  //             lastName: true,
  //             email: true,
  //             avatar: true,
  //           },
  //         },
  //       },
  //     });
  //   }
  // Update the create method in course.repository.ts

  async create(createCourseDto: CreateCourseDto, instructorId: string) {
    const { categoryId, ...courseData } = createCourseDto;

    // Prepare the data object
    const data: any = {
      ...courseData,
      instructor: {
        connect: { id: instructorId },
      },
    };

    // Only add category relation if categoryId is provided
    if (categoryId) {
      data.category = {
        connect: { id: categoryId },
      };
    }

    return this.prisma.course.create({
      data,
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        category: true,
      },
    });
  }

  // Update findAll methods to include category
  async findAll() {
    return this.prisma.course.findMany({
      where: { isPublished: true },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        category: true, // Include category
        lessons: {
          where: { isPublished: true },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            order: true,
            duration: true,
            isPublished: true,
          },
        },
        enrollments: {
          select: {
            id: true,
            studentId: true,
            status: true,
            enrolledAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findAllAdmin() {
    return this.prisma.course.findMany({
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        lessons: {
          orderBy: { order: 'asc' },
        },
        enrollments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.course.findUnique({
      where: { id },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            bio: true,
          },
        },
        category: true, // Include category
        lessons: {
          where: { isPublished: true },
          orderBy: { order: 'asc' },
          include: {
            resources: true,
            quizzes: {
              select: {
                id: true,
                title: true,
                timeLimit: true,
                passingScore: true,
              },
            },
          },
        },
        enrollments: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
    });
  }

  async findByInstructor(instructorId: string) {
    return this.prisma.course.findMany({
      where: { instructorId },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
        },
        enrollments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Update method to find by category
  async findByCategory(categoryId: string) {
    return this.prisma.course.findMany({
      where: {
        categoryId,
        isPublished: true,
      },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
  async update(id: string, updateCourseDto: UpdateCourseDto) {
    return this.prisma.course.update({
      where: { id },
      data: updateCourseDto,
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    // First delete related records
    await this.prisma.$transaction([
      this.prisma.resource.deleteMany({
        where: { lesson: { courseId: id } },
      }),
      this.prisma.lesson.deleteMany({
        where: { courseId: id },
      }),
      this.prisma.enrollment.deleteMany({
        where: { courseId: id },
      }),
      this.prisma.course.delete({
        where: { id },
      }),
    ]);

    return { deleted: true };
  }

  async publish(id: string) {
    return this.prisma.course.update({
      where: { id },
      data: { isPublished: true },
    });
  }

  async unpublish(id: string) {
    return this.prisma.course.update({
      where: { id },
      data: { isPublished: false },
    });
  }

  async updateThumbnail(id: string, thumbnailUrl: string) {
    return this.prisma.course.update({
      where: { id },
      data: { thumbnail: thumbnailUrl },
    });
  }

  async count() {
    return this.prisma.course.count();
  }

  async countByInstructor(instructorId: string) {
    return this.prisma.course.count({
      where: { instructorId },
    });
  }
}
