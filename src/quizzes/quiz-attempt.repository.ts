import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuizAttemptRepository {
  constructor(private prisma: PrismaService) {}

  async create(quizId: string, studentId: string) {
    return this.prisma.quizAttempt.create({
      data: {
        quizId,
        studentId,
        startedAt: new Date(),
      },
      include: {
        quiz: {
          include: {
            questions: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.quizAttempt.findUnique({
      where: { id },
      include: {
        quiz: {
          include: {
            lesson: {
              // ✅ ADD THIS
              include: {
                course: true, // ✅ ADD THIS
              },
            },
            questions: {
              include: {
                options: true,
              },
            },
          },
        },
        answers: {
          include: {
            question: true,
          },
        },
        student: {
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

  async findByQuiz(quizId: string) {
    return this.prisma.quizAttempt.findMany({
      where: { quizId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: { answers: true },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });
  }

  async findByStudent(studentId: string) {
    return this.prisma.quizAttempt.findMany({
      where: { studentId },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            passingScore: true,
            lesson: {
              include: {
                course: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: { answers: true },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });
  }

  async submitAttempt(
    attemptId: string,
    score: number,
    passed: boolean,
    answers: { questionId: string; answer: string; isCorrect: boolean }[],
  ) {
    return this.prisma.$transaction(async (prisma) => {
      // Create answers
      await prisma.studentAnswer.createMany({
        data: answers.map((a) => ({
          attemptId,
          questionId: a.questionId,
          answer: a.answer,
          isCorrect: a.isCorrect,
        })),
      });

      // Update attempt
      return prisma.quizAttempt.update({
        where: { id: attemptId },
        data: {
          score,
          passed,
          completedAt: new Date(),
        },
        include: {
          answers: {
            include: {
              question: true,
            },
          },
        },
      });
    });
  }

  async getStudentAttemptsForQuiz(quizId: string, studentId: string) {
    return this.prisma.quizAttempt.findMany({
      where: {
        quizId,
        studentId,
      },
      include: {
        _count: {
          select: { answers: true },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });
  }

  async hasPassedQuiz(quizId: string, studentId: string) {
    const attempt = await this.prisma.quizAttempt.findFirst({
      where: {
        quizId,
        studentId,
        passed: true,
      },
    });
    return !!attempt;
  }
}
