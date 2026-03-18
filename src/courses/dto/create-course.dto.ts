import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsBoolean,
  MaxLength,
  MinLength,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  duration?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  price?: number;

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @IsUUID()
  @IsNotEmpty()
  categoryId: string;
}
