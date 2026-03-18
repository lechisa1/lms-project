// src/enrollments/dto/create-enrollment.dto.ts
import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateEnrollmentDto {
  @IsUUID()
  @IsNotEmpty()
  courseId: string;
}
