// src/enrollments/enrollment.controller.ts (fixed)
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import {
  UpdateEnrollmentStatusDto,
  UpdateProgressDto,
} from './dto/update-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { EnrollmentResponseDto } from './dto/enrollment-response.dto';
import { Serialize } from '../common/interceptors/serialize.interceptor';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
@Controller('enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Serialize(EnrollmentResponseDto)
export class EnrollmentsController {
  constructor(private readonly enrollmentService: EnrollmentsService) {}

  @Post()
  @Roles('STUDENT')
  async enroll(@Req() req, @Body() createEnrollmentDto: CreateEnrollmentDto) {
    return this.enrollmentService.enroll(req.user.id, createEnrollmentDto);
  }

  @Get()
  async findAll(@Req() req) {
    return this.enrollmentService.findAll(req.user.id, req.user.role);
  }

  @Get('my-enrollments')
  @Roles('STUDENT')
  async getMyEnrollments(@Req() req) {
    return this.enrollmentService.findByStudent(
      req.user.id,
      req.user.id,
      req.user.role,
    );
  }

  @Get('student/:studentId')
  @Roles('ADMIN', 'INSTRUCTOR')
  async findByStudent(@Param('studentId') studentId: string, @Req() req) {
    return this.enrollmentService.findByStudent(
      studentId,
      req.user.id,
      req.user.role,
    );
  }

  @Get('course/:courseId')
  @Roles('ADMIN', 'INSTRUCTOR')
  async findByCourse(@Param('courseId') courseId: string, @Req() req) {
    return this.enrollmentService.findByCourse(
      courseId,
      req.user.id,
      req.user.role,
    );
  }

  @Get('stats')
  @Roles('ADMIN', 'INSTRUCTOR')
  async getStats(@Query('courseId') courseId: string, @Req() req) {
    return this.enrollmentService.getEnrollmentStats(
      courseId,
      req.user.id,
      req.user.role,
    );
  }

  @Get('student/:studentId/progress-summary')
  @Roles('ADMIN', 'STUDENT')
  async getStudentProgressSummary(
    @Param('studentId') studentId: string,
    @Req() req,
  ) {
    return this.enrollmentService.getStudentProgressSummary(
      studentId,
      req.user.id,
      req.user.role,
    );
  }

  @Get('course/:courseId/my-enrollment')
  @Roles('STUDENT')
  async getMyEnrollmentByCourse(
    @Param('courseId') courseId: string,
    @Req() req,
  ) {
    return this.enrollmentService.getEnrollmentByCourse(courseId, req.user.id);
  }

  @Get('course/:courseId/eligibility')
  @Roles('STUDENT')
  async checkCertificateEligibility(
    @Param('courseId') courseId: string,
    @Req() req,
  ) {
    return this.enrollmentService.checkCertificateEligibility(
      courseId,
      req.user.id,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req) {
    return this.enrollmentService.findOne(id, req.user.id, req.user.role);
  }

  @Get(':id/progress')
  async getProgress(@Param('id') id: string, @Req() req) {
    return this.enrollmentService.getProgress(id, req.user.id, req.user.role);
  }

  @Post(':id/lessons/:lessonId/complete')
  @Roles('STUDENT')
  async completeLesson(
    @Param('id') id: string,
    @Param('lessonId') lessonId: string,
    @Req() req,
  ) {
    return this.enrollmentService.completeLesson(id, lessonId, req.user.id);
  }

  @Patch(':id/progress')
  @Roles('STUDENT')
  async updateProgress(
    @Param('id') id: string,
    @Body() updateProgressDto: UpdateProgressDto,
    @Req() req,
  ) {
    return this.enrollmentService.updateProgress(
      id,
      updateProgressDto,
      req.user.id,
    );
  }

  @Patch(':id/status')
  @Roles('ADMIN', 'INSTRUCTOR')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateEnrollmentStatusDto: UpdateEnrollmentStatusDto,
    @Req() req,
  ) {
    // Validate status
    if (!updateEnrollmentStatusDto.status) {
      throw new BadRequestException('Status is required');
    }

    return this.enrollmentService.updateStatus(
      id,
      updateEnrollmentStatusDto.status,
      req.user.id,
      req.user.role,
    );
  }

  @Delete(':id')
  @Roles('ADMIN')
  async remove(@Param('id') id: string, @Req() req) {
    return this.enrollmentService.remove(id, req.user.id, req.user.role);
  }
}
