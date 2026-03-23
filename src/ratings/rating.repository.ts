// src/ratings/rating.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RatingRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    rating: number;
    comment?: string;
    studentId: string;
    courseId: string;
  }) {
    return this.prisma.rating.create({
      data,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });
  }

  async findByCourse(courseId: string) {
    return this.prisma.rating.findMany({
      where: { courseId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByStudent(studentId: string, courseId: string) {
    return this.prisma.rating.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
    });
  }

  async update(id: string, data: { rating: number; comment?: string }) {
    return this.prisma.rating.update({
      where: { id },
      data,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    return this.prisma.rating.delete({
      where: { id },
    });
  }

  async getAverageRating(courseId: string) {
    const result = await this.prisma.rating.aggregate({
      where: { courseId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    return {
      average: result._avg.rating || 0,
      count: result._count.rating,
    };
  }
}
