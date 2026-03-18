import { Exclude, Expose, Type } from 'class-transformer';

class CourseSummaryDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  thumbnail?: string;

  @Expose()
  price: number;

  @Expose()
  isPublished: boolean;

  @Expose()
  instructor: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

@Exclude()
export class CategoryResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  @Type(() => CourseSummaryDto)
  courses?: CourseSummaryDto[];

  @Expose()
  courseCount: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<CategoryResponseDto>) {
    Object.assign(this, partial);
    this.courseCount = this.courses?.length || 0;
  }
}
