import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateResourceDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  type: string; // PDF, VIDEO, AUDIO, DOCUMENT

  @IsString()
  @IsNotEmpty()
  url: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  fileSize?: number;

  @IsString()
  @IsOptional()
  mimeType?: string;
}

export class ResourceResponseDto {
  id: string;
  title: string;
  type: string;
  url: string;
  fileSize?: number;
  mimeType?: string;
  lessonId: string;
  createdAt: Date;
  updatedAt: Date;
}
