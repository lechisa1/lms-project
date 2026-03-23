import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EnrollmentRepository {
  constructor(private prisma: PrismaService) {}

  async create(studentId: string, courseId: string) {
    return this.prisma.$transaction(async (prisma) => {
      // Create enrollment
      const enrollment = await prisma.enrollment.create({
        data: {
          studentId,
          courseId,
          status: 'ACTIVE',
        },
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
          course: {
            include: {
              instructor: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
              category: true,
            },
          },
        },
      });

      // Get total lessons count
      const totalLessons = await prisma.lesson.count({
        where: {
          courseId,
          isPublished: true,
        },
      });

      // Create progress summary
      await prisma.progressSummary.create({
        data: {
          enrollmentId: enrollment.id,
          totalLessons,
          completedLessons: 0,
          progressPercent: 0,
        },
      });

      return enrollment;
    });
  }

  async findAll() {
    return this.prisma.enrollment.findMany({
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
        course: {
          include: {
            instructor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            category: true,
          },
        },
        progress: true,
      },
      orderBy: {
        enrolledAt: 'desc',
      },
    });
  }

  async findByStudent(studentId: string) {
    return this.prisma.enrollment.findMany({
      where: { studentId },
      include: {
        course: {
          include: {
            instructor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            category: true,
            lessons: {
              where: { isPublished: true },
              select: {
                id: true,
                title: true,
                order: true,
              },
              orderBy: { order: 'asc' },
            },
          },
        },
        progress: true,
        lessonProgresses: {
          include: {
            lesson: {
              select: {
                id: true,
                title: true,
                order: true,
              },
            },
          },
        },
      },
      orderBy: {
        enrolledAt: 'desc',
      },
    });
  }

  async findByCourse(courseId: string) {
    return this.prisma.enrollment.findMany({
      where: { courseId },
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
        progress: true,
        lessonProgresses: true,
      },
      orderBy: {
        enrolledAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.enrollment.findUnique({
      where: { id },
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
        course: {
          include: {
            instructor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            category: true,
            lessons: {
              where: { isPublished: true },
              orderBy: { order: 'asc' },
              include: {
                resources: true,
              },
            },
          },
        },
        progress: true,
        lessonProgresses: {
          orderBy: {
            lesson: {
              order: 'asc',
            },
          },
        },
      },
    });
  }

  async findOneByStudentAndCourse(studentId: string, courseId: string) {
    return this.prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
      include: {
        course: {
          include: {
            lessons: {
              where: { isPublished: true },
              orderBy: { order: 'asc' },
              include: {
                resources: true,
              },
            },
          },
        },
        progress: true,
        lessonProgresses: true,
      },
    });
  }

  async updateStatus(id: string, status: string) {
    const updateData: any = { status };

    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    return this.prisma.enrollment.update({
      where: { id },
      data: updateData,
      include: {
        progress: true,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.$transaction([
      this.prisma.lessonProgress.deleteMany({
        where: { enrollmentId: id },
      }),
      this.prisma.progressSummary.deleteMany({
        where: { enrollmentId: id },
      }),
      this.prisma.enrollment.delete({
        where: { id },
      }),
    ]);
  }

  async getEnrollmentStats(courseId?: string) {
    const whereClause = courseId ? { courseId } : {};

    const stats = await this.prisma.enrollment.groupBy({
      by: ['status'],
      where: whereClause,
      _count: {
        _all: true,
      },
    });

    const total = await this.prisma.enrollment.count({ where: whereClause });

    return {
      total,
      byStatus: stats.reduce((acc, curr) => {
        acc[curr.status] = curr._count._all;
        return acc;
      }, {}),
    };
  }

  async count() {
    return this.prisma.enrollment.count();
  }

  async getRecentEnrollments(limit: number = 5) {
    return this.prisma.enrollment.findMany({
      take: limit,
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
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        enrolledAt: 'desc',
      },
    });
  }

  async getTopCourses(limit: number = 4) {
    const coursesWithEnrollments = await this.prisma.course.findMany({
      include: {
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      where: {
        isPublished: true,
      },
    });

    // Sort by enrollment count and take top courses
    const sorted = coursesWithEnrollments
      .sort((a, b) => b._count.enrollments - a._count.enrollments)
      .slice(0, limit);

    // Get course details for each
    return this.prisma.course.findMany({
      where: {
        id: { in: sorted.map((c) => c.id) },
      },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });
  }

  async getCompletionRate() {
    const total = await this.prisma.enrollment.count();
    if (total === 0) return 0;

    const completed = await this.prisma.enrollment.count({
      where: { status: 'COMPLETED' },
    });

    return Math.round((completed / total) * 100);
  }
}
