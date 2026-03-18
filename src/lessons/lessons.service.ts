import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { LessonRepository } from './lesson.repository';
import { CourseRepository } from '../courses/course.repository';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@Injectable()
export class LessonsService {
  constructor(
    private lessonRepository: LessonRepository,
    private courseRepository: CourseRepository,
  ) {}

  async create(
    createLessonDto: CreateLessonDto,
    courseId: string,
    instructorId: string,
  ) {
    // Verify course exists and belongs to instructor
    const course = await this.courseRepository.findOne(courseId);
    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    if (course.instructorId !== instructorId) {
      throw new ForbiddenException(
        'You can only add lessons to your own courses',
      );
    }

    // Check if order is available
    const existingLessons = await this.lessonRepository.findAll(courseId);
    if (existingLessons.some((l) => l.order === createLessonDto.order)) {
      // Shift existing lessons
      await this.shiftLessonOrders(courseId, createLessonDto.order);
    }

    return this.lessonRepository.create(
      createLessonDto,
      courseId,
      instructorId,
    );
  }

  async findAll(courseId: string, user?: any) {
    const course = await this.courseRepository.findOne(courseId);
    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    const lessons = await this.lessonRepository.findAll(courseId);

    // Filter based on user permissions
    if (user) {
      const isAdmin = user.role === 'ADMIN';
      const isInstructor =
        user.role === 'INSTRUCTOR' && course.instructorId === user.id;
      const isEnrolled = course.enrollments?.some(
        (e) => e.studentId === user.id,
      );

      if (isAdmin || isInstructor || isEnrolled) {
        return lessons; // Return all lessons including unpublished
      }
    }

    // Return only published lessons for others
    return lessons.filter((lesson) => lesson.isPublished);
  }

  async findOne(id: string, user?: any) {
    const lesson = await this.lessonRepository.findOne(id);

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }

    // Check access permissions
    if (user) {
      const isAdmin = user.role === 'ADMIN';
      const isInstructor =
        user.role === 'INSTRUCTOR' && lesson.course.instructorId === user.id;
      const course = await this.courseRepository.findOne(lesson.courseId);
      const isEnrolled = course?.enrollments?.some(
        (e) => e.studentId === user.id,
      );

      if (!isAdmin && !isInstructor && !isEnrolled && !lesson.isPublished) {
        throw new ForbiddenException('You do not have access to this lesson');
      }
    } else if (!lesson.isPublished) {
      throw new ForbiddenException('This lesson is not published');
    }

    return lesson;
  }

  async update(
    id: string,
    updateLessonDto: UpdateLessonDto,
    userId: string,
    userRole: string,
  ) {
    const lesson = await this.lessonRepository.findOne(id);

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }

    // Check permissions
    if (userRole !== 'ADMIN' && lesson.course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only update lessons in your own courses',
      );
    }

    // If order is being updated, handle reordering
    if (updateLessonDto.order && updateLessonDto.order !== lesson.order) {
      const courseLessons = await this.lessonRepository.findAll(
        lesson.courseId,
      );
      if (
        courseLessons.some(
          (l) => l.order === updateLessonDto.order && l.id !== id,
        )
      ) {
        await this.shiftLessonOrders(
          lesson.courseId,
          updateLessonDto.order,
          id,
        );
      }
    }

    return this.lessonRepository.update(id, updateLessonDto);
  }

  async remove(id: string, userId: string, userRole: string) {
    const lesson = await this.lessonRepository.findOne(id);

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }

    if (userRole !== 'ADMIN' && lesson.course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only delete lessons from your own courses',
      );
    }

    return this.lessonRepository.remove(id);
  }

  async reorder(
    courseId: string,
    lessonOrders: { id: string; order: number }[],
  ) {
    const course = await this.courseRepository.findOne(courseId);
    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    return this.lessonRepository.reorder(courseId, lessonOrders);
  }

  private async shiftLessonOrders(
    courseId: string,
    startOrder: number,
    excludeLessonId?: string,
  ) {
    const lessons = await this.lessonRepository.findAll(courseId);
    const updates = lessons
      .filter((l) => l.order >= startOrder && l.id !== excludeLessonId)
      .map((lesson) => ({
        id: lesson.id,
        order: lesson.order + 1,
      }));

    if (updates.length > 0) {
      await this.lessonRepository.reorder(courseId, updates);
    }
  }
}
