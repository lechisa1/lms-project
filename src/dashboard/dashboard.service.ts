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

  async getInstructorStats(instructorId: string) {
    const [totalCourses, enrollments] = await Promise.all([
      this.courseRepository.findByInstructor(instructorId),
      this.enrollmentRepository.findByInstructor(instructorId),
    ]);

    const publishedCourses = totalCourses.filter((c: any) => c.isPublished);
    const totalStudents = new Set(enrollments.map((e: any) => e.studentId))
      .size;

    // Calculate average rating from courses (if rating field exists)
    const coursesWithRating = totalCourses.filter(
      (c: any) => c.rating && c.rating > 0,
    );
    const ratings = coursesWithRating.map((c: any) => c.rating);
    const avgRating =
      ratings.length > 0
        ? parseFloat(
            (
              ratings.reduce((a: number, b: number) => a + b, 0) /
              ratings.length
            ).toFixed(1),
          )
        : 0;

    return {
      totalCourses: totalCourses.length,
      publishedCourses: publishedCourses.length,
      totalStudents,
      avgRating,
    };
  }

  async getInstructorCourses(instructorId: string) {
    const courses = await this.courseRepository.findByInstructor(instructorId);

    // Get enrollment counts for each course
    const coursesWithStats = await Promise.all(
      courses.map(async (course: any) => {
        const enrollments = await this.enrollmentRepository.findByCourse(
          course.id,
        );
        const publishedEnrollments = enrollments.filter(
          (e: any) => e.status === 'ACTIVE' || e.status === 'COMPLETED',
        );

        return {
          id: course.id,
          title: course.title,
          description: course.description,
          thumbnail: course.thumbnail,
          isPublished: course.isPublished,
          createdAt: course.createdAt,
          studentCount: publishedEnrollments.length,
          rating: (course as any).rating || 0,
          lessonCount: course.lessons?.length || 0,
        };
      }),
    );

    return coursesWithStats;
  }

  async getInstructorRecentStudents(instructorId: string) {
    const enrollments =
      await this.enrollmentRepository.getRecentEnrollmentsByInstructor(
        instructorId,
        10,
      );

    return enrollments.map((enrollment) => ({
      id: enrollment.id,
      studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
      courseTitle: enrollment.course.title,
      enrolledAt: enrollment.createdAt,
      progress: 0, // Will need to calculate from progress records
    }));
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

  // ============ ADMIN REPORTS ============

  async getEnrollmentReport(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get enrollments in date range
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
        status: true,
      },
    });

    // Group by date
    const enrollmentsByDate: Record<
      string,
      { total: number; completed: number; active: number }
    > = {};

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      enrollmentsByDate[dateStr] = { total: 0, completed: 0, active: 0 };
    }

    enrollments.forEach((enrollment) => {
      const dateStr = enrollment.createdAt.toISOString().split('T')[0];
      if (enrollmentsByDate[dateStr]) {
        enrollmentsByDate[dateStr].total++;
        if (enrollment.status === 'COMPLETED') {
          enrollmentsByDate[dateStr].completed++;
        } else if (
          enrollment.status === 'ACTIVE' ||
          enrollment.status === 'IN_PROGRESS'
        ) {
          enrollmentsByDate[dateStr].active++;
        }
      }
    });

    // Convert to array sorted by date
    const trend = Object.entries(enrollmentsByDate)
      .map(([date, data]) => ({
        date,
        total: data.total,
        completed: data.completed,
        active: data.active,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Summary stats
    const totalEnrollments = enrollments.length;
    const completedEnrollments = enrollments.filter(
      (e) => e.status === 'COMPLETED',
    ).length;
    const activeEnrollments = enrollments.filter(
      (e) => e.status === 'ACTIVE' || e.status === 'IN_PROGRESS',
    ).length;

    return {
      summary: {
        totalEnrollments,
        completedEnrollments,
        activeEnrollments,
        completionRate:
          totalEnrollments > 0
            ? Math.round((completedEnrollments / totalEnrollments) * 100)
            : 0,
      },
      trend,
    };
  }

  async getCourseReport() {
    // Get all published courses with enrollment stats
    const courses = await this.prisma.course.findMany({
      where: {
        isPublished: true,
      },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        category: true,
        enrollments: true,
      },
    });

    // Get course progress data
    const courseStats = await Promise.all(
      courses.map(async (course) => {
        const totalStudents = course.enrollments.length;
        const completedStudents = course.enrollments.filter(
          (e) => e.status === 'COMPLETED',
        ).length;
        const activeStudents = course.enrollments.filter(
          (e) => e.status === 'ACTIVE' || e.status === 'IN_PROGRESS',
        ).length;

        // Get average progress for this course using ProgressSummary
        const progressRecords = await this.prisma.progressSummary.findMany({
          where: {
            enrollment: {
              courseId: course.id,
            },
          },
        });

        const avgProgress =
          progressRecords.length > 0
            ? Math.round(
                progressRecords.reduce((acc, p) => acc + p.progressPercent, 0) /
                  progressRecords.length,
              )
            : 0;

        return {
          id: course.id,
          title: course.title,
          instructor: course.instructor
            ? `${course.instructor.firstName} ${course.instructor.lastName}`
            : 'Unknown',
          category: course.category?.name || 'Uncategorized',
          totalStudents,
          completedStudents,
          activeStudents,
          completionRate:
            totalStudents > 0
              ? Math.round((completedStudents / totalStudents) * 100)
              : 0,
          avgProgress,
          rating: (course as any).rating || 0,
        };
      }),
    );

    // Sort by total students
    courseStats.sort((a, b) => b.totalStudents - a.totalStudents);

    const summary = {
      totalCourses: courses.length,
      totalStudents: courseStats.reduce((acc, c) => acc + c.totalStudents, 0),
      totalCompletions: courseStats.reduce(
        (acc, c) => acc + c.completedStudents,
        0,
      ),
      avgCompletionRate:
        courseStats.length > 0
          ? Math.round(
              courseStats.reduce((acc, c) => acc + c.completionRate, 0) /
                courseStats.length,
            )
          : 0,
    };

    return {
      summary,
      courses: courseStats,
    };
  }

  async getUserReport(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get roles
    const studentRole = await this.prisma.role.findFirst({
      where: { name: 'STUDENT' },
    });
    const instructorRole = await this.prisma.role.findFirst({
      where: { name: 'INSTRUCTOR' },
    });
    const adminRole = await this.prisma.role.findFirst({
      where: { name: 'ADMIN' },
    });

    // Get users by role
    const [students, instructors, admins] = await Promise.all([
      this.prisma.user.count({ where: { roleId: studentRole?.id } }),
      this.prisma.user.count({ where: { roleId: instructorRole?.id } }),
      this.prisma.user.count({ where: { roleId: adminRole?.id } }),
    ]);

    // Get new users in date range
    const newUsers = await this.prisma.user.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
        role: true,
      },
    });

    // Group by date
    const usersByDate: Record<
      string,
      { students: number; instructors: number; admins: number }
    > = {};

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      usersByDate[dateStr] = { students: 0, instructors: 0, admins: 0 };
    }

    newUsers.forEach((user) => {
      const dateStr = user.createdAt.toISOString().split('T')[0];
      if (usersByDate[dateStr]) {
        if (user.role.name === 'STUDENT') usersByDate[dateStr].students++;
        else if (user.role.name === 'INSTRUCTOR')
          usersByDate[dateStr].instructors++;
        else if (user.role.name === 'ADMIN') usersByDate[dateStr].admins++;
      }
    });

    // Convert to array sorted by date
    const trend = Object.entries(usersByDate)
      .map(([date, data]) => ({
        date,
        students: data.students,
        instructors: data.instructors,
        admins: data.admins,
        total: data.students + data.instructors + data.admins,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get active users (users who logged in recently)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeUsers = await this.prisma.user.count({
      where: {
        lastLoginAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    return {
      summary: {
        totalUsers: students + instructors + admins,
        totalStudents: students,
        totalInstructors: instructors,
        totalAdmins: admins,
        newUsers: newUsers.length,
        activeUsers,
      },
      trend,
    };
  }

  async getCertificateReport(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get certificates in date range
    const certificates = await this.prisma.certificate.findMany({
      where: {
        issueDate: {
          gte: startDate,
        },
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        course: {
          select: {
            title: true,
          },
        },
      },
    });

    // Group by date
    const certsByDate: Record<string, number> = {};

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      certsByDate[dateStr] = 0;
    }

    certificates.forEach((cert) => {
      const dateStr = cert.issueDate.toISOString().split('T')[0];
      if (certsByDate[dateStr]) {
        certsByDate[dateStr]++;
      }
    });

    const trend = Object.entries(certsByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get total certificates
    const totalCertificates = await this.prisma.certificate.count();

    // Get top courses by certificates
    const courseCertCounts = await this.prisma.certificate.groupBy({
      by: ['courseId'],
      _count: true,
      orderBy: {
        _count: {
          courseId: 'desc',
        },
      },
      take: 5,
    });

    const topCourses = await Promise.all(
      courseCertCounts.map(async (item) => {
        const course = await this.prisma.course.findUnique({
          where: { id: item.courseId },
          select: { title: true },
        });
        return {
          courseId: item.courseId,
          courseTitle: course?.title || 'Unknown',
          certificateCount: item._count,
        };
      }),
    );

    return {
      summary: {
        totalCertificates,
        certificatesIssued: certificates.length,
        certificatesThisMonth: certificates.length,
      },
      trend,
      topCourses,
    };
  }

  async getRevenueReport(days: number = 30) {
    // This is a simplified revenue report - in a real app, you'd have payment data
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get enrollments with course prices
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      include: {
        course: {
          select: {
            price: true,
          },
        },
      },
    });

    // Group by date
    const revenueByDate: Record<string, number> = {};

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      revenueByDate[dateStr] = 0;
    }

    let totalRevenue = 0;
    enrollments.forEach((enrollment) => {
      const price = enrollment.course.price || 0;
      totalRevenue += price;
      const dateStr = enrollment.createdAt.toISOString().split('T')[0];
      if (revenueByDate[dateStr]) {
        revenueByDate[dateStr] += price;
      }
    });

    const trend = Object.entries(revenueByDate)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get all-time revenue
    const allEnrollments = await this.prisma.enrollment.findMany({
      include: {
        course: {
          select: {
            price: true,
          },
        },
      },
    });

    const allTimeRevenue = allEnrollments.reduce(
      (acc, e) => acc + (e.course.price || 0),
      0,
    );

    return {
      summary: {
        totalRevenue,
        allTimeRevenue,
        totalEnrollments: enrollments.length,
        avgRevenuePerEnrollment:
          enrollments.length > 0
            ? Math.round(totalRevenue / enrollments.length)
            : 0,
      },
      trend,
    };
  }
}
