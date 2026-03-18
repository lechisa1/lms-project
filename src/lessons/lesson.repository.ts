import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@Injectable()
export class LessonRepository {
  constructor(private prisma: PrismaService) {}

  async create(
    createLessonDto: CreateLessonDto,
    courseId: string,
    instructorId: string,
  ) {
    return this.prisma.lesson.create({
      data: {
        ...createLessonDto,
        courseId,
        instructorId,
      },
      include: {
        resources: true,
      },
    });
  }

  async findAll(courseId: string) {
    return this.prisma.lesson.findMany({
      where: { courseId },
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
    });
  }

  async findOne(id: string) {
    return this.prisma.lesson.findUnique({
      where: { id },
      include: {
        resources: true,
        quizzes: {
          include: {
            questions: {
              include: {
                options: true,
              },
            },
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            instructorId: true,
          },
        },
      },
    });
  }

  async update(id: string, updateLessonDto: UpdateLessonDto) {
    return this.prisma.lesson.update({
      where: { id },
      data: updateLessonDto,
      include: {
        resources: true,
      },
    });
  }

  async remove(id: string) {
    // Delete related resources first
    await this.prisma.resource.deleteMany({
      where: { lessonId: id },
    });

    return this.prisma.lesson.delete({
      where: { id },
    });
  }

  async reorder(
    courseId: string,
    lessonOrders: { id: string; order: number }[],
  ) {
    const updates = lessonOrders.map(({ id, order }) =>
      this.prisma.lesson.update({
        where: { id },
        data: { order },
      }),
    );

    return this.prisma.$transaction(updates);
  }

  async publish(id: string) {
    return this.prisma.lesson.update({
      where: { id },
      data: { isPublished: true },
    });
  }

  async unpublish(id: string) {
    return this.prisma.lesson.update({
      where: { id },
      data: { isPublished: false },
    });
  }

  async countByCourse(courseId: string) {
    return this.prisma.lesson.count({
      where: { courseId },
    });
  }
}
