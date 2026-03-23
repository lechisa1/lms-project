// src/ratings/dto/rating-response.dto.ts
export class RatingResponseDto {
  id: string;
  rating: number;
  comment?: string;
  studentId: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  courseId: string;
  createdAt: Date;
  updatedAt: Date;
}
