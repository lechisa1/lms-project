import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { CreateQuestionDto } from './dto/create-question.dto';

@Injectable()
export class QuizRepository {
  constructor(private prisma: PrismaService) {}

  async create(
    createQuizDto: CreateQuizDto,
    lessonId: string,
    instructorId: string,
  ) {
    return this.prisma.quiz.create({
      data: {
        ...createQuizDto,
        lessonId,
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });
  }

  async findAll(lessonId: string) {
    return this.prisma.quiz.findMany({
      where: { lessonId },
      include: {
        questions: {
          include: {
            options: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: { attempts: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.quiz.findUnique({
      where: { id },
      include: {
        lesson: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                instructorId: true,
              },
            },
          },
        },
        questions: {
          include: {
            options: {
              orderBy: {
                order: 'asc',
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
        attempts: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: {
            startedAt: 'desc',
          },
          take: 10,
        },
      },
    });
  }

  async findOneWithCorrectAnswers(id: string) {
    return this.prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            options: true, // Include all options with correct answers for grading
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
  }

  async update(id: string, updateQuizDto: UpdateQuizDto) {
    return this.prisma.quiz.update({
      where: { id },
      data: updateQuizDto,
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    // Delete related records in transaction
    return this.prisma.$transaction([
      this.prisma.studentAnswer.deleteMany({
        where: { attempt: { quizId: id } },
      }),
      this.prisma.quizAttempt.deleteMany({
        where: { quizId: id },
      }),
      this.prisma.questionOption.deleteMany({
        where: { question: { quizId: id } },
      }),
      this.prisma.question.deleteMany({
        where: { quizId: id },
      }),
      this.prisma.quiz.delete({
        where: { id },
      }),
    ]);
  }

  async addQuestion(quizId: string, createQuestionDto: CreateQuestionDto) {
    const { options, ...questionData } = createQuestionDto;

    return this.prisma.question.create({
      data: {
        ...questionData,
        quizId,
        options: {
          create: (options || []).map((opt, index) => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
            order: opt.order ?? index,
          })),
        },
      },
      include: {
        options: true,
      },
    });
  }

  async addQuestionsBulk(quizId: string, questions: CreateQuestionDto[]) {
    return this.prisma.$transaction(
      questions.map((q) => {
        const { options, ...questionData } = q;
        return this.prisma.question.create({
          data: {
            ...questionData,
            quizId,
            options: {
              create: options || [],
            },
          },
        });
      }),
    );
  }

  async updateQuestion(questionId: string, updateData: any) {
    const { options, ...questionData } = updateData;

    return this.prisma.question.update({
      where: { id: questionId },
      data: {
        ...questionData,
        options: options
          ? {
              deleteMany: {},
              create: options,
            }
          : undefined,
      },
      include: {
        options: true,
      },
    });
  }

  async removeQuestion(questionId: string) {
    return this.prisma.$transaction([
      this.prisma.questionOption.deleteMany({
        where: { questionId },
      }),
      this.prisma.question.delete({
        where: { id: questionId },
      }),
    ]);
  }

  async countUserAttempts(quizId: string, studentId: string) {
    return this.prisma.quizAttempt.count({
      where: {
        quizId,
        studentId,
      },
    });
  }

  async getUserBestAttempt(quizId: string, studentId: string) {
    return this.prisma.quizAttempt.findFirst({
      where: {
        quizId,
        studentId,
      },
      orderBy: {
        score: 'desc',
      },
    });
  }
}
