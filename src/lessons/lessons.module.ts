// src/lessons/lesson.module.ts
import { Module } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { LessonsController } from './lessons.controller';
import { LessonRepository } from './lesson.repository';
import { CourseRepository } from '../courses/course.repository';
import { PrismaService } from '../prisma/prisma.service';
import { RoleModule } from 'src/roles/roles.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [RoleModule, NotificationsModule],
  controllers: [LessonsController],
  providers: [
    LessonsService,
    LessonRepository,
    CourseRepository,
    PrismaService,
  ],
  exports: [LessonsService, LessonRepository],
})
export class LessonsModule {}
