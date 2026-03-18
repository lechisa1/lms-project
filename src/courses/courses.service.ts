// src/courses/course.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { CourseRepository } from './course.repository';
import { LessonRepository } from '../lessons/lesson.repository';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { UserService } from 'src/user/user.service';
import { CategoriesService } from 'src/categories/categories.service';
// import { DEFAULT_ROLES } from '../roles/interfaces/role.interface';

@Injectable()
export class CoursesService {
  constructor(
    private courseRepository: CourseRepository,
    private lessonRepository: LessonRepository,
    private userService: UserService,
    private categoryService: CategoriesService,
  ) {}

  async create(createCourseDto: CreateCourseDto, instructorId: string) {
    // Verify instructor exists
    const instructor = await this.userService.findOne(instructorId);
    if (!instructor) {
      throw new NotFoundException('Instructor not found');
    }

    // Verify category exists
    const category = await this.categoryService.findOne(
      createCourseDto.categoryId,
    );
    if (!category) {
      throw new NotFoundException(
        `Category with ID ${createCourseDto.categoryId} not found`,
      );
    }

    return this.courseRepository.create(createCourseDto, instructorId);
  }

  async findAll(user?: any) {
    if (user && (user.role === 'ADMIN' || user.role === 'INSTRUCTOR')) {
      return this.courseRepository.findAllAdmin();
    }
    return this.courseRepository.findAll();
  }

  async findOne(id: string, user?: any) {
    const course = await this.courseRepository.findOne(id);

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    // Check access permissions
    if (user) {
      const isAdmin = user.role === 'ADMIN';
      const isInstructor =
        user.role === 'INSTRUCTOR' && course.instructorId === user.id;
      const isEnrolled = course.enrollments.some(
        (e) => e.studentId === user.id,
      );

      if (!isAdmin && !isInstructor && !isEnrolled && !course.isPublished) {
        throw new ForbiddenException('You do not have access to this course');
      }
    }

    return course;
  }

  async findByInstructor(instructorId: string) {
    const instructor = await this.userService.findOne(instructorId);
    if (!instructor) {
      throw new NotFoundException('Instructor not found');
    }

    return this.courseRepository.findByInstructor(instructorId);
  }

  async findByCategory(category: string) {
    return this.courseRepository.findByCategory(category);
  }

  async update(
    id: string,
    updateCourseDto: UpdateCourseDto,
    userId: string,
    userRole: string,
  ) {
    const course = await this.courseRepository.findOne(id);

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    // Check permissions
    if (userRole !== 'ADMIN' && course.instructorId !== userId) {
      throw new ForbiddenException('You can only update your own courses');
    }

    return this.courseRepository.update(id, updateCourseDto);
  }

  async remove(id: string, userId: string, userRole: string) {
    const course = await this.courseRepository.findOne(id);

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    // Check permissions
    if (userRole !== 'ADMIN' && course.instructorId !== userId) {
      throw new ForbiddenException('You can only delete your own courses');
    }

    return this.courseRepository.remove(id);
  }

  async publish(id: string, userId: string, userRole: string) {
    const course = await this.courseRepository.findOne(id);

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    if (userRole !== 'ADMIN' && course.instructorId !== userId) {
      throw new ForbiddenException('You can only publish your own courses');
    }

    // Check if course has at least one lesson before publishing
    const lessonCount = await this.lessonRepository.countByCourse(id);
    if (lessonCount === 0) {
      throw new ConflictException('Cannot publish course without lessons');
    }

    return this.courseRepository.publish(id);
  }

  async unpublish(id: string, userId: string, userRole: string) {
    const course = await this.courseRepository.findOne(id);

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    if (userRole !== 'ADMIN' && course.instructorId !== userId) {
      throw new ForbiddenException('You can only unpublish your own courses');
    }

    return this.courseRepository.unpublish(id);
  }

  async updateThumbnail(
    id: string,
    thumbnailUrl: string,
    userId: string,
    userRole: string,
  ) {
    const course = await this.courseRepository.findOne(id);

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    if (userRole !== 'ADMIN' && course.instructorId !== userId) {
      throw new ForbiddenException('You can only update your own courses');
    }

    return this.courseRepository.updateThumbnail(id, thumbnailUrl);
  }

  async getCourseAnalytics(id: string, userId: string, userRole: string) {
    const course = await this.courseRepository.findOne(id);

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    if (userRole !== 'ADMIN' && course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only view analytics for your own courses',
      );
    }

    const totalStudents = course.enrollments.length;
    const completedStudents = course.enrollments.filter(
      (e) => e.status === 'COMPLETED',
    ).length;
    const activeStudents = course.enrollments.filter(
      (e) => e.status === 'ACTIVE',
    ).length;

    return {
      totalStudents,
      completedStudents,
      activeStudents,
      completionRate:
        totalStudents > 0 ? (completedStudents / totalStudents) * 100 : 0,
      totalLessons: course.lessons.length,
      publishedLessons: course.lessons.filter((l) => l.isPublished).length,
    };
  }
  // Add method to get courses by category
  async getCoursesByCategory(categoryId: string) {
    const category = await this.categoryService.findOne(categoryId);
    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    return this.courseRepository.findByCategory(categoryId);
  }
}
