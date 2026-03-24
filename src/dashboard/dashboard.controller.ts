import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // Admin dashboard endpoints
  @Get('stats')
  @Roles('ADMIN')
  async getStats() {
    return this.dashboardService.getStats();
  }

  // Instructor dashboard endpoints
  @Get('instructor/stats')
  @Roles('INSTRUCTOR')
  async getInstructorStats(@Req() req) {
    return this.dashboardService.getInstructorStats(req.user.id);
  }

  @Get('instructor/courses')
  @Roles('INSTRUCTOR')
  async getInstructorCourses(@Req() req) {
    return this.dashboardService.getInstructorCourses(req.user.id);
  }

  @Get('instructor/recent-students')
  @Roles('INSTRUCTOR')
  async getInstructorRecentStudents(@Req() req) {
    return this.dashboardService.getInstructorRecentStudents(req.user.id);
  }

  @Get('recent-enrollments')
  @Roles('ADMIN', 'INSTRUCTOR')
  async getRecentEnrollments(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 5;
    return this.dashboardService.getRecentEnrollments(limitNum);
  }

  @Get('top-courses')
  @Roles('ADMIN', 'INSTRUCTOR')
  async getTopCourses(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 4;
    return this.dashboardService.getTopCourses(limitNum);
  }

  // Student dashboard endpoints
  @Get('student')
  @Roles('STUDENT')
  async getStudentDashboard(@Req() req) {
    return this.dashboardService.getStudentDashboard(req.user.id);
  }

  // Admin Reports endpoints
  @Get('reports/enrollments')
  @Roles('ADMIN')
  async getEnrollmentReport(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.dashboardService.getEnrollmentReport(daysNum);
  }

  @Get('reports/courses')
  @Roles('ADMIN')
  async getCourseReport() {
    return this.dashboardService.getCourseReport();
  }

  @Get('reports/users')
  @Roles('ADMIN')
  async getUserReport(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.dashboardService.getUserReport(daysNum);
  }

  @Get('reports/certificates')
  @Roles('ADMIN')
  async getCertificateReport(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.dashboardService.getCertificateReport(daysNum);
  }

  @Get('reports/revenue')
  @Roles('ADMIN')
  async getRevenueReport(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.dashboardService.getRevenueReport(daysNum);
  }
}
