import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  SearchCoursesDto,
  SearchInstructorsDto,
  FilterOptionsDto,
} from './dto/search.dto';
import {
  SearchResponseDto,
  SearchResultDto,
  InstructorSearchResultDto,
} from './dto/search-response.dto';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async searchCourses(searchDto: SearchCoursesDto): Promise<SearchResponseDto> {
    const {
      q,
      category,
      minPrice,
      maxPrice,
      duration,
      level,
      instructor,
      page = 1,
      limit = 10,
      sortBy = 'relevance',
      sortOrder = 'desc',
      tags,
    } = searchDto;

    // Build where clause
    const where: any = {
      isPublished: true,
    };

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { category: { name: { contains: q, mode: 'insensitive' } } },
        {
          instructor: {
            OR: [
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    if (category) {
      where.category = { name: category };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    if (duration) {
      where.duration = { lte: duration };
    }

    if (level) {
      where.level = level;
    }

    if (instructor) {
      where.instructor = {
        OR: [
          { firstName: { contains: instructor, mode: 'insensitive' } },
          { lastName: { contains: instructor, mode: 'insensitive' } },
        ],
      };
    }

    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    // Get total count
    const total = await this.prisma.course.count({ where });

    // Build order by
    let orderBy: any = {};
    switch (sortBy) {
      case 'price':
        orderBy = { price: sortOrder };
        break;
      case 'date':
        orderBy = { createdAt: sortOrder };
        break;
      case 'popularity':
        orderBy = { enrollments: { _count: sortOrder } };
        break;
      case 'relevance':
      default:
        if (q) {
          // For relevance, we'll sort by search rank in memory
          orderBy = { title: 'asc' };
        } else {
          orderBy = { createdAt: 'desc' };
        }
    }

    // Get courses
    const courses = await this.prisma.course.findMany({
      where,
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        category: true,
        _count: {
          select: {
            enrollments: true,
            lessons: true,
          },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    // Get filter options
    const filters = await this.getFilterOptions({ q, category });

    // Calculate relevance scores if search query exists
    let results: SearchResultDto[] = courses.map((course) => {
      const result: SearchResultDto = {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail ?? undefined,
        category: course.category?.name || 'Uncategorized',
        instructor: {
          id: course.instructor.id,
          name: `${course.instructor.firstName} ${course.instructor.lastName}`,
          avatar: course.instructor.avatar ?? undefined,
        },
        price: course.price || 0,
        duration: course.duration || 0,
        studentsCount: course._count.enrollments,
        lessonsCount: course._count.lessons,
      };

      if (q) {
        // Simple relevance scoring
        let score = 0;
        const lowerQ = q.toLowerCase();
        const lowerTitle = course.title.toLowerCase();
        const lowerDesc = course.description.toLowerCase();

        if (lowerTitle.includes(lowerQ)) score += 10;
        if (lowerTitle.startsWith(lowerQ)) score += 5;
        if (lowerDesc.includes(lowerQ)) score += 3;

        result.relevanceScore = score;
      }

      return result;
    });

    // Sort by relevance if needed
    if (q && sortBy === 'relevance') {
      results = results.sort(
        (a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0),
      );
    }

    return {
      results,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      filters,
    };
  }

  async searchInstructors(searchDto: SearchInstructorsDto) {
    const { q, expertise, page = 1, limit = 10 } = searchDto;

    const where: any = {
      role: {
        name: 'INSTRUCTOR',
      },
    };

    if (q) {
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { bio: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (expertise) {
      where.bio = { contains: expertise, mode: 'insensitive' };
    }

    const total = await this.prisma.user.count({ where });

    const instructors = await this.prisma.user.findMany({
      where,
      include: {
        coursesCreated: {
          select: {
            id: true,
            title: true,
            _count: {
              select: {
                enrollments: true,
              },
            },
          },
        },
        _count: {
          select: {
            coursesCreated: true,
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const results: InstructorSearchResultDto[] = instructors.map(
      (instructor) => ({
        id: instructor.id,
        name: `${instructor.firstName} ${instructor.lastName}`,
        email: instructor.email,
        avatar: instructor.avatar ?? undefined,
        bio: instructor.bio ?? undefined,
        coursesCount: instructor._count.coursesCreated,
        studentsCount: instructor.coursesCreated.reduce(
          (sum, course) => sum + (course._count?.enrollments || 0),
          0,
        ),
      }),
    );

    return {
      results,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getFilterOptions(options: FilterOptionsDto) {
    const { q, category: selectedCategory } = options;

    // Get categories with counts
    const categories = await this.prisma.category.findMany({
      include: {
        _count: {
          select: {
            courses: {
              where: { isPublished: true },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Get price range
    const priceAgg = await this.prisma.course.aggregate({
      where: { isPublished: true },
      _min: { price: true },
      _max: { price: true },
    });

    // Get levels (you might want to add a level field to Course model)
    const levels = [
      { name: 'Beginner', count: 25 },
      { name: 'Intermediate', count: 40 },
      { name: 'Advanced', count: 20 },
    ];

    // Get duration ranges
    const durations = [
      { range: '0-5 hours', count: 30 },
      { range: '5-10 hours', count: 45 },
      { range: '10-20 hours', count: 35 },
      { range: '20+ hours', count: 25 },
    ];

    return {
      categories: categories.map((c) => ({
        name: c.name,
        count: c._count.courses,
      })),
      priceRange: {
        min: priceAgg._min.price || 0,
        max: priceAgg._max.price || 1000,
      },
      levels,
      durations,
    };
  }

  async getSearchSuggestions(query: string) {
    const suggestions = await this.prisma.course.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { category: { name: { contains: query, mode: 'insensitive' } } },
        ],
      },
      select: {
        title: true,
        category: {
          select: { name: true },
        },
      },
      distinct: ['title'],
      take: 5,
    });

    const categorySuggestions = await this.prisma.category.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' },
      },
      select: { name: true },
      take: 3,
    });

    return {
      courses: suggestions.map((s) => s.title),
      categories: categorySuggestions.map((c) => c.name),
    };
  }

  async getTrendingSearches() {
    // This would typically come from a search analytics service
    // For now, return some popular courses
    const trending = await this.prisma.course.findMany({
      where: { isPublished: true },
      orderBy: {
        enrollments: {
          _count: 'desc',
        },
      },
      take: 5,
      select: {
        title: true,
        category: {
          select: { name: true },
        },
        _count: {
          select: { enrollments: true },
        },
      },
    });

    return {
      trending: trending.map((t) => t.title),
    };
  }
}
