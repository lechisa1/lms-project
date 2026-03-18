// src/courses/course.controller.ts
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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseResponseDto } from './dto/course-response.dto';
import { Serialize } from '../common/interceptors/serialize.interceptor';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('courses')
@Serialize(CourseResponseDto)
export class CoursesController {
  constructor(private readonly courseService: CoursesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('INSTRUCTOR', 'ADMIN')
  async create(@Body() createCourseDto: CreateCourseDto, @Req() req) {
    return this.courseService.create(createCourseDto, req.user.id);
  }

  @Get()
  async findAll(@Req() req) {
    return this.courseService.findAll(req.user);
  }

  @Get('instructor/:instructorId')
  async findByInstructor(@Param('instructorId') instructorId: string) {
    return this.courseService.findByInstructor(instructorId);
  }

  @Get('category/:category')
  async findByCategory(@Param('category') category: string) {
    return this.courseService.findByCategory(category);
  }

  @Get('analytics/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INSTRUCTOR', 'ADMIN')
  async getAnalytics(@Param('id') id: string, @Req() req) {
    return this.courseService.getCourseAnalytics(
      id,
      req.user.id,
      req.user.role,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req) {
    return this.courseService.findOne(id, req.user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INSTRUCTOR', 'ADMIN')
  async update(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @Req() req,
  ) {
    return this.courseService.update(
      id,
      updateCourseDto,
      req.user.id,
      req.user.role,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INSTRUCTOR', 'ADMIN')
  async remove(@Param('id') id: string, @Req() req) {
    return this.courseService.remove(id, req.user.id, req.user.role);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INSTRUCTOR', 'ADMIN')
  async publish(@Param('id') id: string, @Req() req) {
    return this.courseService.publish(id, req.user.id, req.user.role);
  }

  @Post(':id/unpublish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INSTRUCTOR', 'ADMIN')
  async unpublish(@Param('id') id: string, @Req() req) {
    return this.courseService.unpublish(id, req.user.id, req.user.role);
  }
  @Get('category/:categoryId')
  async getCoursesByCategory(@Param('categoryId') categoryId: string) {
    return this.courseService.getCoursesByCategory(categoryId);
  }

  @Get('category/:categoryId/analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getCategoryCourseAnalytics(@Param('categoryId') categoryId: string) {
    return this.courseService.getCoursesByCategory(categoryId);
  }
  @Post(':id/thumbnail')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INSTRUCTOR', 'ADMIN')
  @UseInterceptors(FileInterceptor('thumbnail'))
  async uploadThumbnail(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ) {
    // Here you would upload to cloud storage and get URL
    const thumbnailUrl = file.path; // Temporary
    return this.courseService.updateThumbnail(
      id,
      thumbnailUrl,
      req.user.id,
      req.user.role,
    );
  }
}
