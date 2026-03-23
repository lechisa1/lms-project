import { Injectable } from '@nestjs/common';
import { UserRepository } from '../user/user.repository';
import { CourseRepository } from '../courses/course.repository';
import { EnrollmentRepository } from '../enrollments/enrollment.repository';
import { CertificateRepository } from '../certificates/certificate.repository';
import { ProgressRepository } from '../enrollments/progress.repository';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(
    private userRepository: UserRepository,
    private courseRepository: CourseRepository,
    private enrollmentRepository: EnrollmentRepository,
    private certificateRepository: CertificateRepository,
    private progressRepository: ProgressRepository,
    private prisma: PrismaService,
  ) {}

  async getStats() {
    const [totalStudents, totalCourses, enrollmentStats, completionRate] =
      await Promise.all([
        this.userRepository.countByRole('STUDENT'),
        this.courseRepository.count(),
        this.enrollmentRepository.getEnrollmentStats(),
        this.enrollmentRepository.getCompletionRate(),
      ]);

    const byStatus = enrollmentStats.byStatus as Record<string, number>;
    const activeEnrollments =
      (byStatus['ACTIVE'] || 0) + (byStatus['IN_PROGRESS'] || 0);

    return {
      totalStudents,
      totalCourses,
      activeEnrollments,
      completionRate,
    };
  }

  async getRecentEnrollments(limit: number = 5) {
    return this.enrollmentRepository.getRecentEnrollments(limit);
  }

  async getTopCourses(limit: number = 4) {
    return this.enrollmentRepository.getTopCourses(limit);
  }

  async getStudentDashboard(studentId: string) {
    // Get student enrollments with progress
    const enrollments =
      await this.enrollmentRepository.findByStudent(studentId);

    // Get certificates
    const certificates =
      await this.certificateRepository.findByStudent(studentId);

    // Get progress summary
    const progress =
      await this.progressRepository.getStudentProgress(studentId);

    // Calculate stats
    const totalCourses = enrollments.length;
    const completedCourses = enrollments.filter(
      (e) => e.status === 'COMPLETED',
    ).length;
    const inProgressCourses = enrollments.filter(
      (e) => e.status === 'ACTIVE',
    ).length;
    const certificatesCount = certificates.length;

    // Calculate average progress
    const totalProgress = progress.reduce(
      (acc, p) => acc + p.progressPercent,
      0,
    );
    const averageProgress =
      totalCourses > 0 ? Math.round(totalProgress / totalCourses) : 0;

    // Get recommended courses (published courses not enrolled in)
    const enrolledCourseIds = enrollments.map((e) => e.courseId);
    const allCourses = await this.courseRepository.findAll();
    const recommendedCourses = allCourses
      .filter((c) => c.isPublished && !enrolledCourseIds.includes(c.id))
      .slice(0, 4);

    // Get weekly learning activity
    const weeklyActivity = await this.getWeeklyLearningActivity(studentId);

    // Format enrollments with progress
    const myCourses = enrollments.map((enrollment) => ({
      id: enrollment.id,
      courseId: enrollment.course.id,
      title: enrollment.course.title,
      instructor: enrollment.course.instructor
        ? {
            firstName: enrollment.course.instructor.firstName,
            lastName: enrollment.course.instructor.lastName,
          }
        : null,
      progress: enrollment.progress?.progressPercent || 0,
      totalLessons: enrollment.progress?.totalLessons || 0,
      completedLessons: enrollment.progress?.completedLessons || 0,
      lastAccessed: enrollment.progress?.lastAccessedAt
        ? new Date(enrollment.progress.lastAccessedAt).toISOString()
        : enrollment.enrolledAt,
      status: enrollment.status,
      enrolledAt: enrollment.enrolledAt,
    }));

    // Format certificates
    const earnedCertificates = certificates.map((cert) => ({
      id: cert.id,
      courseTitle: cert.course?.title || 'Unknown Course',
      issueDate: cert.issueDate,
    }));

    return {
      stats: {
        enrolledCourses: totalCourses,
        completed: completedCourses,
        inProgress: inProgressCourses,
        certificates: certificatesCount,
        averageProgress,
      },
      myCourses,
      recommendedCourses: recommendedCourses.map((course) => ({
        id: course.id,
        title: course.title,
        instructor: course.instructor
          ? {
              firstName: course.instructor.firstName,
              lastName: course.instructor.lastName,
            }
          : null,
        duration: course.duration,
        level: 'Intermediate', // Default, could be extended
        studentsCount: 0, // Not available in basic course
        rating: 0, // Not available
      })),
      certificates: earnedCertificates,
      weeklyActivity,
    };
  }

  private async getWeeklyLearningActivity(studentId: string) {
    // Get the start of the current week (Sunday)
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Get lesson progress for the current week
    const lessonProgress = await this.prisma.lessonProgress.findMany({
      where: {
        studentId,
        completedAt: {
          gte: startOfWeek,
        },
      },
      select: {
        completedAt: true,
      },
      orderBy: {
        completedAt: 'asc',
      },
    });

    // Group by day and calculate minutes (estimate 10 minutes per lesson)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyMinutes = new Array(7).fill(0);

    lessonProgress.forEach((progress) => {
      if (progress.completedAt) {
        const dayIndex = progress.completedAt.getDay();
        weeklyMinutes[dayIndex] += 10; // Estimate 10 minutes per completed lesson
      }
    });

    const thisWeek = days.map((day: string, index: number) => ({
      day,
      minutes: weeklyMinutes[index] as number,
    }));

    // Calculate current streak (consecutive days with activity in the past)
    const currentStreak = this.calculateCurrentStreak(weeklyMinutes);

    return {
      current: currentStreak,
      longest: Math.max(
        currentStreak,
        ...weeklyMinutes.filter((m) => m > 0).map(() => 1),
      ),
      thisWeek,
    };
  }

  private calculateCurrentStreak(weeklyMinutes: number[]): number {
    // Calculate streak based on this week's activity
    let streak = 0;
    const today = new Date().getDay();

    // Count consecutive days with activity from today backwards
    for (let i = today; i >= 0; i--) {
      if (weeklyMinutes[i] > 0) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }
}
