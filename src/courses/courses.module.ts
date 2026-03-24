import { LessonRepository } from 'src/lessons/lesson.repository';
import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { CourseRepository } from './course.repository';

import { UserService } from 'src/user/user.service';
import { UserRepository } from 'src/user/user.repository';
import { RoleRepository } from '../roles/role.repository';
import { PrismaService } from '../prisma/prisma.service';
import { RoleModule } from 'src/roles/roles.module';
import { CategoriesModule } from 'src/categories/categories.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [RoleModule, CategoriesModule, NotificationsModule],
  controllers: [CoursesController],
  providers: [
    CoursesService,
    CourseRepository,
    LessonRepository,
    UserService,
    UserRepository,
    RoleRepository,
    PrismaService,
  ],
  exports: [CoursesService, CourseRepository, LessonRepository],
})
export class CoursesModule {}
