import { Exclude, Expose, Type } from 'class-transformer';

class InstructorDto {
  @Expose()
  id: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  email: string;

  @Expose()
  avatar?: string;
}

class LessonSummaryDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  order: number;

  @Expose()
  duration?: number;

  @Expose()
  isPublished: boolean;
}

class EnrollmentSummaryDto {
  @Expose()
  id: string;

  @Expose()
  studentId: string;

  @Expose()
  status: string;

  @Expose()
  enrolledAt: Date;
}

@Exclude()
export class CourseResponseDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  description: string;

  @Expose()
  category: string;

  @Expose()
  duration: number;

  @Expose()
  thumbnail: string;

  @Expose()
  price: number;

  @Expose()
  isPublished: boolean;

  @Expose()
  @Type(() => InstructorDto)
  instructor: InstructorDto;

  @Expose()
  @Type(() => LessonSummaryDto)
  lessons: LessonSummaryDto[];

  @Expose()
  @Type(() => EnrollmentSummaryDto)
  enrollments: EnrollmentSummaryDto[];

  @Expose()
  totalLessons: number;

  @Expose()
  totalStudents: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<CourseResponseDto>) {
    Object.assign(this, partial);
    this.totalLessons = this.lessons?.length || 0;
    this.totalStudents = this.enrollments?.length || 0;
  }
}
