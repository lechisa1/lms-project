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
}
