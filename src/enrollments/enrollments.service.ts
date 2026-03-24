import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { EnrollmentRepository } from './enrollment.repository';
import { ProgressRepository } from './progress.repository';
import { CourseRepository } from '../courses/course.repository';
import { UserService } from 'src/user/user.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateProgressDto } from './dto/update-enrollment.dto';

@Injectable()
export class EnrollmentsService {
  constructor(
    private enrollmentRepository: EnrollmentRepository,
    private progressRepository: ProgressRepository,
    private courseRepository: CourseRepository,
    private userService: UserService,
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
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

  private async checkAllLessonsCompleted(
    courseId: string,
    studentId: string,
  ): Promise<boolean> {
    // Get all published lessons for the course
    const totalLessons = await this.prisma.lesson.count({
      where: {
        courseId,
        isPublished: true,
      },
    });

    if (totalLessons === 0) {
      // If there are no lessons, consider it completed
      return true;
    }

    // Get completed lessons count
    const completedLessons = await this.prisma.lessonProgress.count({
      where: {
        studentId,
        lesson: {
          courseId,
          isPublished: true,
        },
        completed: true,
      },
    });

    return completedLessons >= totalLessons;
  }

  async enroll(studentId: string, createEnrollmentDto: CreateEnrollmentDto) {
    const { courseId } = createEnrollmentDto;

    // Check if student exists
    const student = await this.userService.findOne(studentId);
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Check if course exists and is published
    const course = await this.courseRepository.findOne(courseId);
    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    if (!course.isPublished) {
      throw new BadRequestException('Cannot enroll in an unpublished course');
    }

    // Check if already enrolled
    const existingEnrollment =
      await this.enrollmentRepository.findOneByStudentAndCourse(
        studentId,
        courseId,
      );

    if (existingEnrollment) {
      throw new ConflictException('Already enrolled in this course');
    }

    // Create enrollment
    const enrollment = await this.enrollmentRepository.create(
      studentId,
      courseId,
    );

    // Send notification to student
    await this.notificationsService.createNotification({
      userId: studentId,
      title: 'Course Enrollment',
      message: `You have successfully enrolled in "${course.title}". Start learning now!`,
      type: 'COURSE',
      metadata: {
        courseId: course.id,
        courseTitle: course.title,
        enrollmentId: enrollment.id,
      },
    });

    // Notify instructor about new enrollment
    await this.notificationsService.createNotification({
      userId: course.instructorId,
      title: 'New Student Enrollment',
      message: `${student.firstName} ${student.lastName} has enrolled in your course "${course.title}".`,
      type: 'COURSE',
      metadata: {
        courseId: course.id,
        courseTitle: course.title,
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        enrollmentId: enrollment.id,
      },
    });

    return enrollment;
  }

  async findAll(userId: string, userRole: string) {
    if (userRole === 'ADMIN') {
      return this.enrollmentRepository.findAll();
    } else if (userRole === 'INSTRUCTOR') {
      // Instructors can see enrollments for their courses
      const courses = await this.courseRepository.findByInstructor(userId);
      const courseIds = courses.map((c) => c.id);

      const enrollments = await Promise.all(
        courseIds.map((id) => this.enrollmentRepository.findByCourse(id)),
      );

      return enrollments.flat();
    } else {
      // Students can only see their own enrollments
      return this.enrollmentRepository.findByStudent(userId);
    }
  }

  async findOne(id: string, userId: string, userRole: string) {
    const enrollment = await this.enrollmentRepository.findOne(id);

    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID ${id} not found`);
    }

    // Check permissions
    if (
      userRole !== 'ADMIN' &&
      enrollment.studentId !== userId &&
      enrollment.course.instructorId !== userId
    ) {
      throw new ForbiddenException('You do not have access to this enrollment');
    }

    return enrollment;
  }

  async findByStudent(
    studentId: string,
    requestingUserId: string,
    userRole: string,
  ) {
    if (userRole !== 'ADMIN' && studentId !== requestingUserId) {
      throw new ForbiddenException('You can only view your own enrollments');
    }

    return this.enrollmentRepository.findByStudent(studentId);
  }

  async findByCourse(courseId: string, userId: string, userRole: string) {
    const course = await this.courseRepository.findOne(courseId);

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    if (userRole !== 'ADMIN' && course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only view enrollments for your own courses',
      );
    }

    return this.enrollmentRepository.findByCourse(courseId);
  }

  async updateProgress(
    enrollmentId: string,
    updateProgressDto: UpdateProgressDto,
    userId: string,
  ) {
    const enrollment = await this.enrollmentRepository.findOne(enrollmentId);

    if (!enrollment) {
      throw new NotFoundException(
        `Enrollment with ID ${enrollmentId} not found`,
      );
    }

    if (enrollment.studentId !== userId) {
      throw new ForbiddenException('You can only update your own progress');
    }

    if (enrollment.status === 'COMPLETED') {
      throw new BadRequestException('Course already completed');
    }

    if (enrollment.status === 'DROPPED') {
      throw new BadRequestException(
        'Cannot update progress for dropped enrollment',
      );
    }

    if (updateProgressDto.lessonId) {
      // Update lesson progress
      await this.progressRepository.updateLessonProgress(
        enrollmentId,
        userId,
        updateProgressDto.lessonId,
        true,
      );
    }

    // Get updated progress
    const progress =
      await this.progressRepository.getProgressSummary(enrollmentId);
    const lessonProgress = await this.progressRepository.getLessonProgress(
      enrollmentId,
      userId,
    );

    return {
      progress,
      lessonProgress,
    };
  }

  async completeLesson(enrollmentId: string, lessonId: string, userId: string) {
    const enrollment = await this.enrollmentRepository.findOne(enrollmentId);

    if (!enrollment) {
      throw new NotFoundException(
        `Enrollment with ID ${enrollmentId} not found`,
      );
    }

    if (enrollment.studentId !== userId) {
      throw new ForbiddenException(
        'You can only complete lessons for your own enrollments',
      );
    }

    // Check if lesson belongs to course
    const lesson = enrollment.course.lessons.find((l) => l.id === lessonId);
    if (!lesson) {
      throw new NotFoundException(
        `Lesson with ID ${lessonId} not found in this course`,
      );
    }

    return this.progressRepository.updateLessonProgress(
      enrollmentId,
      userId,
      lessonId,
      true,
    );
  }

  async getProgress(enrollmentId: string, userId: string, userRole: string) {
    const enrollment = await this.enrollmentRepository.findOne(enrollmentId);

    if (!enrollment) {
      throw new NotFoundException(
        `Enrollment with ID ${enrollmentId} not found`,
      );
    }

    if (
      userRole !== 'ADMIN' &&
      enrollment.studentId !== userId &&
      enrollment.course.instructorId !== userId
    ) {
      throw new ForbiddenException('You do not have access to this progress');
    }

    const progress =
      await this.progressRepository.getProgressSummary(enrollmentId);
    const lessonProgress = await this.progressRepository.getLessonProgress(
      enrollmentId,
      enrollment.studentId,
    );

    return {
      progress,
      lessonProgress,
      course: {
        id: enrollment.course.id,
        title: enrollment.course.title,
        totalLessons: enrollment.course.lessons.length,
      },
    };
  }

  async updateStatus(
    id: string,
    status: string,
    userId: string,
    userRole: string,
  ) {
    const enrollment = await this.enrollmentRepository.findOne(id);

    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID ${id} not found`);
    }

    // Only admins and instructors can update status
    if (userRole === 'STUDENT') {
      throw new ForbiddenException('Students cannot update enrollment status');
    }

    if (
      userRole === 'INSTRUCTOR' &&
      enrollment.course.instructorId !== userId
    ) {
      throw new ForbiddenException(
        'You can only update enrollments for your own courses',
      );
    }

    return this.enrollmentRepository.updateStatus(id, status);
  }

  async remove(id: string, userId: string, userRole: string) {
    const enrollment = await this.enrollmentRepository.findOne(id);

    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID ${id} not found`);
    }

    // Only admins can delete enrollments
    if (userRole !== 'ADMIN') {
      throw new ForbiddenException('Only admins can delete enrollments');
    }

    return this.enrollmentRepository.remove(id);
  }

  async getEnrollmentStats(
    courseId?: string,
    userId?: string,
    userRole?: string,
  ) {
    if (courseId) {
      const course = await this.courseRepository.findOne(courseId);
      if (!course) {
        throw new NotFoundException(`Course with ID ${courseId} not found`);
      }

      if (userRole !== 'ADMIN' && course.instructorId !== userId) {
        throw new ForbiddenException(
          'You can only view stats for your own courses',
        );
      }
    }

    return this.enrollmentRepository.getEnrollmentStats(courseId);
  }

  async getStudentProgressSummary(
    studentId: string,
    requestingUserId: string,
    userRole: string,
  ) {
    if (userRole !== 'ADMIN' && studentId !== requestingUserId) {
      throw new ForbiddenException('You can only view your own progress');
    }

    const enrollments =
      await this.enrollmentRepository.findByStudent(studentId);
    const progress =
      await this.progressRepository.getStudentProgress(studentId);

    const totalCourses = enrollments.length;
    const completedCourses = enrollments.filter(
      (e) => e.status === 'COMPLETED',
    ).length;
    const inProgressCourses = enrollments.filter(
      (e) => e.status === 'ACTIVE',
    ).length;

    const averageProgress =
      progress.reduce((acc, p) => acc + p.progressPercent, 0) /
      (totalCourses || 1);

    return {
      totalCourses,
      completedCourses,
      inProgressCourses,
      averageProgress,
      enrollments: enrollments.map((e) => ({
        courseId: e.course.id,
        courseTitle: e.course.title,
        status: e.status,
        enrolledAt: e.enrolledAt,
        progress: e.progress?.progressPercent || 0,
        completedLessons: e.progress?.completedLessons || 0,
        totalLessons: e.progress?.totalLessons || 0,
      })),
    };
  }

  async getEnrollmentByCourse(courseId: string, studentId: string) {
    const enrollment =
      await this.enrollmentRepository.findOneByStudentAndCourse(
        studentId,
        courseId,
      );

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    // Get full enrollment with course and lessons
    return this.enrollmentRepository.findOne(enrollment.id);
  }

  async checkCertificateEligibility(courseId: string, studentId: string) {
    // Check if enrolled
    const enrollment =
      await this.enrollmentRepository.findOneByStudentAndCourse(
        studentId,
        courseId,
      );

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    const lessonsCompleted = await this.checkAllLessonsCompleted(
      courseId,
      studentId,
    );
    const quizzesPassed = await this.checkAllQuizzesPassed(courseId, studentId);

    const eligible = lessonsCompleted && quizzesPassed;

    return {
      eligible,
      lessonsCompleted,
      quizzesPassed,
      enrollmentStatus: enrollment.status,
      message: eligible
        ? 'Eligible for certificate'
        : !lessonsCompleted
          ? 'Complete all lessons to be eligible'
          : 'Pass all quizzes to be eligible',
    };
  }
}
