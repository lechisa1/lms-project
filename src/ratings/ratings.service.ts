// src/ratings/ratings.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { RatingRepository } from './rating.repository';
import { CreateRatingDto } from './dto/create-rating.dto';
import { PrismaService } from '../prisma/prisma.service';
import { EnrollmentRepository } from '../enrollments/enrollment.repository';

@Injectable()
export class RatingsService {
  constructor(
    private ratingRepository: RatingRepository,
    private prisma: PrismaService,
    private enrollmentRepository: EnrollmentRepository,
  ) {}

  async create(
    courseId: string,
    createRatingDto: CreateRatingDto,
    studentId: string,
  ) {
    // Check if course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check if student is enrolled in the course
    const enrollment =
      await this.enrollmentRepository.findOneByStudentAndCourse(
        studentId,
        courseId,
      );

    if (!enrollment) {
      throw new ForbiddenException('You must be enrolled to rate this course');
    }

    // Check if student already rated this course
    const existingRating = await this.ratingRepository.findByStudent(
      studentId,
      courseId,
    );

    if (existingRating) {
      throw new BadRequestException('You have already rated this course');
    }

    // Create the rating
    const rating = await this.ratingRepository.create({
      rating: createRatingDto.rating,
      comment: createRatingDto.comment,
      studentId,
      courseId,
    });

    // Update course average rating
    await this.updateCourseAverageRating(courseId);

    return rating;
  }

  async findByCourse(courseId: string) {
    return this.ratingRepository.findByCourse(courseId);
  }

  async findMyRating(studentId: string, courseId: string) {
    return this.ratingRepository.findByStudent(studentId, courseId);
  }

  async update(
    ratingId: string,
    createRatingDto: CreateRatingDto,
    studentId: string,
  ) {
    const rating = await this.prisma.rating.findUnique({
      where: { id: ratingId },
    });

    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    if (rating.studentId !== studentId) {
      throw new ForbiddenException('You can only update your own ratings');
    }

    const updatedRating = await this.ratingRepository.update(ratingId, {
      rating: createRatingDto.rating,
      comment: createRatingDto.comment,
    });

    // Update course average rating
    await this.updateCourseAverageRating(rating.courseId);

    return updatedRating;
  }

  async delete(ratingId: string, studentId: string) {
    const rating = await this.prisma.rating.findUnique({
      where: { id: ratingId },
    });

    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    if (rating.studentId !== studentId) {
      throw new ForbiddenException('You can only delete your own ratings');
    }

    const courseId = rating.courseId;
    await this.ratingRepository.delete(ratingId);

    // Update course average rating
    await this.updateCourseAverageRating(courseId);
  }

  async getCourseRatingStats(courseId: string) {
    return this.ratingRepository.getAverageRating(courseId);
  }

  private async updateCourseAverageRating(courseId: string) {
    const stats = await this.ratingRepository.getAverageRating(courseId);
    await this.prisma.course.update({
      where: { id: courseId },
      data: { rating: stats.average },
    });
  }
}
