import { UserModule } from 'src/user/user.module';
import { CoursesModule } from './../courses/courses.module';
import { RoleModule } from 'src/roles/roles.module';

import { UserRepository } from 'src/user/user.repository';
import { PrismaService } from '../prisma/prisma.service';
import { CoursesService } from 'src/courses/courses.service';

import { Module } from '@nestjs/common';
import { CertificatesController } from './certificates.controller';
import { CertificatesService } from './certificates.service';
import { CertificateRepository } from './certificate.repository';
import { EnrollmentsModule } from 'src/enrollments/enrollments.module';
import { UserService } from 'src/user/user.service';
import { CategoriesModule } from 'src/categories/categories.module';
@Module({
  imports: [
    EnrollmentsModule,
    RoleModule,
    CoursesModule,
    UserModule,
    CategoriesModule,
  ],
  controllers: [CertificatesController],
  providers: [
    CertificatesService,
    CertificateRepository,
    UserService,
    CoursesService,
    PrismaService,
    UserRepository,
  ],
})
export class CertificatesModule {}
