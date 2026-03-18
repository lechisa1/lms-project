import { Module } from '@nestjs/common';
import { QuizzesController } from './quizzes.controller';
import { QuizzesService } from './quizzes.service';
import { QuizRepository } from './quiz.repository';
import { QuizAttemptRepository } from './quiz-attempt.repository';
import { LessonRepository } from 'src/lessons/lesson.repository';
import { EnrollmentRepository } from 'src/enrollments/enrollment.repository';
import { CourseRepository } from 'src/courses/course.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoleModule } from 'src/roles/roles.module';
@Module({
  imports: [RoleModule],
  controllers: [QuizzesController],
  providers: [
    QuizzesService,
    LessonRepository,
    EnrollmentRepository,
    QuizAttemptRepository,
    CourseRepository,
    QuizRepository,
    PrismaService,
  ],
  exports: [QuizzesService, QuizRepository, QuizAttemptRepository],
})
export class QuizzesModule {}
