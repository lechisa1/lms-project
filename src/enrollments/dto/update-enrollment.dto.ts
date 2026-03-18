import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  IsNotEmpty,
  IsIn,
} from 'class-validator';

export class UpdateEnrollmentDto {
  @IsString()
  @IsOptional()
  status?: 'ACTIVE' | 'COMPLETED' | 'DROPPED';

  @IsBoolean()
  @IsOptional()
  completed?: boolean;
}
// Create a separate DTO for status updates
export class UpdateEnrollmentStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['ACTIVE', 'COMPLETED', 'DROPPED'])
  status: 'ACTIVE' | 'COMPLETED' | 'DROPPED';
}
export class UpdateProgressDto {
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  progressPercent?: number;

  @IsString()
  @IsOptional()
  lessonId?: string;
}
