import { PartialType } from '@nestjs/mapped-types';
import { CreateQuestionDto } from './create-question.dto';
import { IsBoolean, IsOptional, IsString, IsNumber } from 'class-validator';

export class UpdateQuestionDto extends PartialType(CreateQuestionDto) {}

export class UpdateQuestionOptionDto {
  @IsString()
  @IsOptional()
  text?: string;

  @IsBoolean()
  @IsOptional()
  isCorrect?: boolean;

  @IsNumber()
  @IsOptional()
  order?: number;
}
