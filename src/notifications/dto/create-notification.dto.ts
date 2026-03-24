import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  type: string; // 'COURSE', 'LESSON', 'QUIZ', 'SYSTEM', 'ENROLLMENT', 'CERTIFICATE'

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
