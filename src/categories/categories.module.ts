import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CategoryRepository } from './category.repository';
import { RoleModule } from 'src/roles/roles.module';
@Module({
  imports: [RoleModule],
  controllers: [CategoriesController],
  providers: [CategoriesService, PrismaService, CategoryRepository],
  exports: [CategoriesService, CategoryRepository],
})
export class CategoriesModule {}
