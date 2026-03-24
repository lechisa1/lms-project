import { Module, forwardRef } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentRepository } from './enrollment.repository';
import { ProgressRepository } from './progress.repository';
import { CourseRepository } from '../courses/course.repository';
import { UserService } from 'src/user/user.service';
import { UserRepository } from 'src/user/user.repository';
import { RoleRepository } from '../roles/role.repository';
import { PrismaService } from '../prisma/prisma.service';

import { RoleModule } from 'src/roles/roles.module';
import { CertificatesModule } from '../certificates/certificates.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    RoleModule,
    forwardRef(() => CertificatesModule),
    NotificationsModule,
  ],
  controllers: [EnrollmentsController],
  providers: [
    EnrollmentsService,
    EnrollmentRepository,
    ProgressRepository,
    CourseRepository,
    UserService,
    UserRepository,
    RoleRepository,
    PrismaService,
  ],
  exports: [EnrollmentsService, EnrollmentRepository, ProgressRepository],
})
export class EnrollmentsModule {}
