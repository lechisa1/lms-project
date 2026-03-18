import {
  IsArray,
  IsUUID,
  IsNotEmpty,
  ValidateNested,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

class AnswerDto {
  @IsUUID()
  @IsNotEmpty()
  questionId: string;

  @IsString()
  @IsNotEmpty()
  answer: string; // Could be option ID or text answer
}

export class StartAttemptDto {
  @IsUUID()
  @IsNotEmpty()
  quizId: string;
}

export class SubmitAttemptDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}
