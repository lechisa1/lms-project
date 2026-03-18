import { Exclude, Expose, Type } from 'class-transformer';

class StudentDto {
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

class CourseDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  description: string;

  @Expose()
  thumbnail?: string;

  @Expose()
  category?: {
    id: string;
    name: string;
  };

  @Expose()
  instructor: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

class ProgressDto {
  @Expose()
  totalLessons: number;

  @Expose()
  completedLessons: number;

  @Expose()
  progressPercent: number;

  @Expose()
  lastAccessedAt?: Date;

  @Expose()
  completedAt?: Date;
}

@Exclude()
export class EnrollmentResponseDto {
  @Expose()
  id: string;

  @Expose()
  @Type(() => StudentDto)
  student: StudentDto;

  @Expose()
  @Type(() => CourseDto)
  course: CourseDto;

  @Expose()
  status: string;

  @Expose()
  enrolledAt: Date;

  @Expose()
  completedAt?: Date;

  @Expose()
  @Type(() => ProgressDto)
  progress?: ProgressDto;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<EnrollmentResponseDto>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class EnrollmentListResponseDto {
  @Expose()
  id: string;

  @Expose()
  courseId: string;

  @Expose()
  courseTitle: string;

  @Expose()
  courseThumbnail?: string;

  @Expose()
  instructorName: string;

  @Expose()
  status: string;

  @Expose()
  enrolledAt: Date;

  @Expose()
  progressPercent: number;

  @Expose()
  completedLessons: number;

  @Expose()
  totalLessons: number;

  constructor(partial: Partial<EnrollmentListResponseDto>) {
    Object.assign(this, partial);
  }
}
