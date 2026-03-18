import { Exclude, Expose, Type } from 'class-transformer';

class ResourceDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  type: string;

  @Expose()
  url: string;

  @Expose()
  fileSize?: number;
}

class QuizSummaryDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  timeLimit?: number;

  @Expose()
  passingScore: number;
}

@Exclude()
export class LessonResponseDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  description: string;

  @Expose()
  content: string;

  @Expose()
  order: number;

  @Expose()
  duration: number;

  @Expose()
  isPublished: boolean;

  @Expose()
  courseId: string;

  @Expose()
  @Type(() => ResourceDto)
  resources: ResourceDto[];

  @Expose()
  @Type(() => QuizSummaryDto)
  quizzes: QuizSummaryDto[];

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<LessonResponseDto>) {
    Object.assign(this, partial);
  }
}
