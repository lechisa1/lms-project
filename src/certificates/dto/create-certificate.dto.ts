import { IsUUID, IsOptional, IsString } from 'class-validator';

export class CreateCertificateDto {
  @IsUUID()
  @IsOptional()
  enrollmentId?: string;

  @IsUUID()
  @IsOptional()
  courseId?: string;
}

export class GenerateCertificateDto {
  @IsUUID()
  @IsOptional()
  enrollmentId?: string;

  @IsUUID()
  @IsOptional()
  courseId?: string;
}

export class VerifyCertificateDto {
  @IsString()
  certificateNo: string;
}
