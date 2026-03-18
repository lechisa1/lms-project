import { Exclude, Expose, Type } from 'class-transformer';

class StudentInfoDto {
  @Expose()
  id: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  email: string;
}

class CourseInfoDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  description: string;

  @Expose()
  category: string;

  @Expose()
  instructor: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

@Exclude()
export class CertificateResponseDto {
  @Expose()
  id: string;

  @Expose()
  certificateNo: string;

  @Expose()
  @Type(() => StudentInfoDto)
  student: StudentInfoDto;

  @Expose()
  @Type(() => CourseInfoDto)
  course: CourseInfoDto;

  @Expose()
  issueDate: Date;

  @Expose()
  expiryDate: Date;

  @Expose()
  downloadCount: number;

  @Expose()
  isValid: boolean;

  @Expose()
  metadata: any;

  @Expose()
  createdAt: Date;

  @Expose()
  qrCodeUrl: string;

  @Expose()
  pdfUrl: string;

  constructor(partial: Partial<CertificateResponseDto>) {
    Object.assign(this, partial);
    this.qrCodeUrl = `/certificates/${this.id}/qr`;
    this.pdfUrl = `/certificates/${this.id}/download`;
  }
}

@Exclude()
export class CertificateListResponseDto {
  @Expose()
  id: string;

  @Expose()
  certificateNo: string;

  @Expose()
  courseTitle: string;

  @Expose()
  issueDate: Date;

  @Expose()
  downloadCount: number;

  @Expose()
  isValid: boolean;

  constructor(partial: Partial<CertificateListResponseDto>) {
    Object.assign(this, partial);
  }
}
