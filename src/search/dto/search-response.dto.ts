export class SearchResultDto {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  category: string;
  instructor: {
    id: string;
    name: string;
    avatar?: string;
  };
  price: number;
  duration: number;
  level?: string;
  rating?: number;
  studentsCount?: number;
  lessonsCount?: number;
  tags?: string[];
  relevanceScore?: number;
}

export class SearchResponseDto {
  results: SearchResultDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filters: {
    categories: { name: string; count: number }[];
    priceRange: { min: number; max: number };
    levels: { name: string; count: number }[];
    durations: { range: string; count: number }[];
  };
}

export class InstructorSearchResultDto {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  expertise?: string[];
  coursesCount: number;
  studentsCount: number;
  rating?: number;
}
