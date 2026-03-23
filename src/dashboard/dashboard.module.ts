import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { UserRepository } from '../user/user.repository';
import { CourseRepository } from '../courses/course.repository';
import { EnrollmentRepository } from '../enrollments/enrollment.repository';
import { CertificateRepository } from '../certificates/certificate.repository';
import { ProgressRepository } from '../enrollments/progress.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { RoleModule } from '../roles/roles.module';
@Module({
  imports: [PrismaModule, RoleModule],
  controllers: [DashboardController],
  providers: [
    DashboardService,
    UserRepository,
    CourseRepository,
    EnrollmentRepository,
    CertificateRepository,
    ProgressRepository,
  ],
  exports: [DashboardService],
})
export class DashboardModule {}
