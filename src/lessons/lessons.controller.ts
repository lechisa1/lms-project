// src/lessons/lesson.controller.ts
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
} from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { LessonResponseDto } from './dto/lesson-response.dto';
import { Serialize } from '../common/interceptors/serialize.interceptor';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('courses/:courseId/lessons')
@Serialize(LessonResponseDto)
export class LessonsController {
  constructor(private readonly lessonService: LessonsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INSTRUCTOR', 'ADMIN')
  async create(
    @Param('courseId') courseId: string,
    @Body() createLessonDto: CreateLessonDto,
    @Req() req,
  ) {
    return this.lessonService.create(createLessonDto, courseId, req.user.id);
  }

  @Get()
  async findAll(@Param('courseId') courseId: string, @Req() req) {
    return this.lessonService.findAll(courseId, req.user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req) {
    return this.lessonService.findOne(id, req.user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INSTRUCTOR', 'ADMIN')
  async update(
    @Param('id') id: string,
    @Body() updateLessonDto: UpdateLessonDto,
    @Req() req,
  ) {
    return this.lessonService.update(
      id,
      updateLessonDto,
      req.user.id,
      req.user.role,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INSTRUCTOR', 'ADMIN')
  async remove(@Param('id') id: string, @Req() req) {
    return this.lessonService.remove(id, req.user.id, req.user.role);
  }

  @Post('reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INSTRUCTOR', 'ADMIN')
  async reorder(
    @Param('courseId') courseId: string,
    @Body() lessonOrders: { id: string; order: number }[],
  ) {
    return this.lessonService.reorder(courseId, lessonOrders);
  }
}
