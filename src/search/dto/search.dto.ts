// src/search/dto/search.dto.ts
import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  IsArray,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SearchCoursesDto {
  @IsString()
  @IsOptional()
  q?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  minPrice?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  maxPrice?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  duration?: number;

  @IsString()
  @IsOptional()
  level?: string; // beginner, intermediate, advanced

  @IsString()
  @IsOptional()
  instructor?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number = 10;

  @IsString()
  @IsOptional()
  sortBy?: string = 'relevance'; // relevance, price, date, popularity

  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsArray()
  @IsOptional()
  @Type(() => String)
  tags?: string[];
}

export class SearchInstructorsDto {
  @IsString()
  @IsOptional()
  q?: string;

  @IsString()
  @IsOptional()
  expertise?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number = 10;
}

export class FilterOptionsDto {
  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  q?: string;
}
