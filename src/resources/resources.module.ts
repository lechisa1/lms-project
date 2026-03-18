import { Module } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { ResourcesController } from './resources.controller';
import { ResourceRepository } from './resource.repository';
import { LessonRepository } from '../lessons/lesson.repository';
import { PrismaService } from '../prisma/prisma.service';
import { RoleModule } from 'src/roles/roles.module';
@Module({
  imports: [RoleModule],
  controllers: [ResourcesController],
  providers: [
    ResourcesService,
    ResourceRepository,
    LessonRepository,
    PrismaService,
  ],
  exports: [ResourcesService, ResourceRepository],
})
export class ResourcesModule {}
