// src/ratings/ratings.module.ts
import { Module } from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { RatingsController } from './ratings.controller';
import { RatingRepository } from './rating.repository';
import { EnrollmentRepository } from '../enrollments/enrollment.repository';
import { PrismaModule } from 'src/prisma/prisma.module';
@Module({
  imports: [PrismaModule],
  providers: [RatingsService, RatingRepository, EnrollmentRepository],
  controllers: [RatingsController],
  exports: [RatingsService],
})
export class RatingsModule {}
