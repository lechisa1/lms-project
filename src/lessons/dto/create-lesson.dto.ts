import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsInt,
  Min,
  MaxLength,
  MinLength,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLessonDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsInt()
  @IsNotEmpty()
  @Min(1)
  @Type(() => Number)
  order: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  duration?: number;

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}
