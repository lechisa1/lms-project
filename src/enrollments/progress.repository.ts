import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CertificateRepository } from '../certificates/certificate.repository';

@Injectable()
export class ProgressRepository {
  constructor(
    private prisma: PrismaService,
    private certificateRepository?: CertificateRepository,
  ) {}

  private async checkAllQuizzesPassed(
    courseId: string,
    studentId: string,
  ): Promise<boolean> {
    // Get all published quizzes for the course (through lessons)
    const quizzes = await this.prisma.quiz.findMany({
      where: {
        lesson: {
          courseId,
          isPublished: true,
        },
      },
      select: {
        id: true,
      },
    });

    if (quizzes.length === 0) {
      // If there are no quizzes, consider it passed
      return true;
    }

    // Check if student has passed each quiz
    for (const quiz of quizzes) {
      const passedAttempt = await this.prisma.quizAttempt.findFirst({
        where: {
          quizId: quiz.id,
          studentId,
          passed: true,
        },
      });

      if (!passedAttempt) {
        return false;
      }
    }

    return true;
  }

  async updateLessonProgress(
    enrollmentId: string,
    studentId: string,
    lessonId: string,
    completed: boolean,
  ) {
    return this.prisma.$transaction(async (prisma) => {
      // Upsert lesson progress
      const lessonProgress = await prisma.lessonProgress.upsert({
        where: {
          studentId_lessonId: {
            studentId,
            lessonId,
          },
        },
        update: {
          completed,
          completedAt: completed ? new Date() : null,
        },
        create: {
          studentId,
          lessonId,
          enrollmentId,
          completed,
          completedAt: completed ? new Date() : null,
        },
      });

      // Update progress summary
      await this.updateProgressSummary(enrollmentId, prisma);

      return lessonProgress;
    });
  }

  async getLessonProgress(enrollmentId: string, studentId: string) {
    return this.prisma.lessonProgress.findMany({
      where: {
        enrollmentId,
        studentId,
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            order: true,
            duration: true,
          },
        },
      },
      orderBy: {
        lesson: {
          order: 'asc',
        },
      },
    });
  }

  async getLessonProgressByLesson(studentId: string, lessonId: string) {
    return this.prisma.lessonProgress.findUnique({
      where: {
        studentId_lessonId: {
          studentId,
          lessonId,
        },
      },
    });
  }

  async updateProgressSummary(enrollmentId: string, prisma?: any) {
    const prismaClient = prisma || this.prisma;

    // Get enrollment details
    const enrollment = await prismaClient.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          include: {
            lessons: {
              where: { isPublished: true },
            },
          },
        },
      },
    });

    if (!enrollment) return null;

    const totalLessons = enrollment.course.lessons.length;

    // Get completed lessons count
    const completedLessons = await prismaClient.lessonProgress.count({
      where: {
        enrollmentId,
        completed: true,
      },
    });

    const progressPercent =
      totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    // Update or create progress summary
    const progressSummary = await prismaClient.progressSummary.upsert({
      where: { enrollmentId },
      update: {
        totalLessons,
        completedLessons,
        progressPercent,
        lastAccessedAt: new Date(),
        completedAt: progressPercent === 100 ? new Date() : null,
      },
      create: {
        enrollmentId,
        totalLessons,
        completedLessons,
        progressPercent,
        lastAccessedAt: new Date(),
      },
    });

    // If progress is 100%, update enrollment status
    if (progressPercent === 100 && enrollment.status !== 'COMPLETED') {
      // Check if all quizzes are passed before marking as COMPLETED
      const allQuizzesPassed = await this.checkAllQuizzesPassed(
        enrollment.courseId,
        enrollment.studentId,
      );

      if (!allQuizzesPassed) {
        // Don't mark as completed yet - quizzes must be passed first
        return progressSummary;
      }

      await prismaClient.enrollment.update({
        where: { id: enrollmentId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // Auto-generate certificate when course is completed
      if (this.certificateRepository) {
        try {
          // Check if certificate already exists
          const existingCertificate = await prismaClient.certificate.findUnique(
            {
              where: { enrollmentId },
            },
          );

          if (!existingCertificate) {
            // Generate certificate number
            const certificateNo =
              await this.certificateRepository.generateCertificateNumber();

            // Get student info
            const student = await prismaClient.user.findUnique({
              where: { id: enrollment.studentId },
              select: { firstName: true, lastName: true },
            });

            // Create certificate
            await prismaClient.certificate.create({
              data: {
                studentId: enrollment.studentId,
                courseId: enrollment.courseId,
                enrollmentId: enrollment.id,
                certificateNo,
                issueDate: new Date(),
                isValid: true,
                metadata: {
                  generatedBy: 'system',
                  courseCompletionDate: new Date(),
                  studentName: `${student.firstName} ${student.lastName}`,
                  courseName: enrollment.course.title,
                },
              },
            });
          }
        } catch (error) {
          // Log error but don't fail the progress update
          console.error('Error auto-generating certificate:', error);
        }
      }
    }

    return progressSummary;
  }

  async getProgressSummary(enrollmentId: string) {
    return this.prisma.progressSummary.findUnique({
      where: { enrollmentId },
    });
  }

  async getStudentProgress(studentId: string) {
    return this.prisma.progressSummary.findMany({
      where: {
        enrollment: {
          studentId,
        },
      },
      include: {
        enrollment: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                thumbnail: true,
              },
            },
          },
        },
      },
    });
  }

  async resetProgress(enrollmentId: string) {
    return this.prisma.$transaction([
      this.prisma.lessonProgress.deleteMany({
        where: { enrollmentId },
      }),
      this.prisma.progressSummary.update({
        where: { enrollmentId },
        data: {
          completedLessons: 0,
          progressPercent: 0,
          lastAccessedAt: new Date(),
          completedAt: null,
        },
      }),
    ]);
  }
}
