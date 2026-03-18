import { Module } from '@nestjs/common';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';
import { RoleModule } from './roles/roles.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { CoursesModule } from './courses/courses.module';
import { LessonsModule } from './lessons/lessons.module';
import { ResourcesModule } from './resources/resources.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { CategoriesModule } from './categories/categories.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { CertificatesModule } from './certificates/certificates.module';
import { SearchModule } from './search/search.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    RoleModule,
    UserModule,
    AuthModule,
    PrismaModule,
    CoursesModule,
    LessonsModule,
    ResourcesModule,
    EnrollmentsModule,
    CategoriesModule,
    QuizzesModule,
    CertificatesModule,
    SearchModule,
  ],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
