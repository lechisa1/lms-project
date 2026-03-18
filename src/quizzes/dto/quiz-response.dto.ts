import { Exclude, Expose, Type } from 'class-transformer';

class QuestionOptionResponseDto {
  @Expose()
  id: string;

  @Expose()
  text: string;

  @Expose()
  order: number;

  @Exclude()
  isCorrect: boolean; // Exclude correct answer from responses
}

class QuestionResponseDto {
  @Expose()
  id: string;

  @Expose()
  text: string;

  @Expose()
  type: string;

  @Expose()
  points: number;

  @Expose()
  order: number;

  @Expose()
  @Type(() => QuestionOptionResponseDto)
  options: QuestionOptionResponseDto[];
}

@Exclude()
export class QuizResponseDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  description: string;

  @Expose()
  timeLimit: number;

  @Expose()
  passingScore: number;

  @Expose()
  maxAttempts: number;

  @Expose()
  lessonId: string;

  @Expose()
  @Type(() => QuestionResponseDto)
  questions: QuestionResponseDto[];

  @Expose()
  totalQuestions: number;

  @Expose()
  totalPoints: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<QuizResponseDto>) {
    Object.assign(this, partial);
    this.totalQuestions = this.questions?.length || 0;
    this.totalPoints =
      this.questions?.reduce((sum, q) => sum + (q.points || 1), 0) || 0;
  }
}

@Exclude()
export class QuizAttemptResponseDto {
  @Expose()
  id: string;

  @Expose()
  score: number;

  @Expose()
  passed: boolean;

  @Expose()
  startedAt: Date;

  @Expose()
  completedAt: Date;

  @Expose()
  quizId: string;

  @Expose()
  quizTitle: string;

  @Expose()
  studentId: string;

  @Expose()
  studentName: string;

  @Expose()
  totalQuestions: number;

  @Expose()
  correctAnswers: number;

  @Expose()
  answers: any[];

  constructor(partial: Partial<QuizAttemptResponseDto>) {
    Object.assign(this, partial);
  }
}
