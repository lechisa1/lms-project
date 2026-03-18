import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchCoursesDto, SearchInstructorsDto } from './dto/search.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('search')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('courses')
  async searchCourses(@Query() searchDto: SearchCoursesDto) {
    return this.searchService.searchCourses(searchDto);
  }

  @Get('instructors')
  async searchInstructors(@Query() searchDto: SearchInstructorsDto) {
    return this.searchService.searchInstructors(searchDto);
  }

  @Get('filters')
  async getFilterOptions(@Query() options: any) {
    return this.searchService.getFilterOptions(options);
  }

  @Get('suggestions')
  async getSuggestions(@Query('q') query: string) {
    if (!query || query.length < 2) {
      return { courses: [], categories: [] };
    }
    return this.searchService.getSearchSuggestions(query);
  }

  @Get('trending')
  async getTrendingSearches() {
    return this.searchService.getTrendingSearches();
  }
}
