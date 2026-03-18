import { IsUUID, IsBoolean, IsOptional } from 'class-validator';

export class UpdateLessonProgressDto {
  @IsUUID()
  @IsOptional()
  lessonId?: string;

  @IsBoolean()
  @IsOptional()
  completed?: boolean;
}

export class LessonProgressResponseDto {
  id: string;
  lessonId: string;
  lessonTitle: string;
  completed: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
