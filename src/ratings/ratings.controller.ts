// src/ratings/ratings.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { RatingResponseDto } from './dto/rating-response.dto';
import { Serialize } from '../common/interceptors/serialize.interceptor';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ratings')
@Serialize(RatingResponseDto)
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post('course/:courseId')
  @UseGuards(JwtAuthGuard)
  async create(
    @Param('courseId') courseId: string,
    @Body() createRatingDto: CreateRatingDto,
    @Req() req,
  ) {
    return this.ratingsService.create(courseId, createRatingDto, req.user.id);
  }

  @Get('course/:courseId')
  async findByCourse(@Param('courseId') courseId: string) {
    return this.ratingsService.findByCourse(courseId);
  }

  @Get('course/:courseId/my-rating')
  @UseGuards(JwtAuthGuard)
  async findMyRating(@Param('courseId') courseId: string, @Req() req) {
    return this.ratingsService.findMyRating(req.user.id, courseId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() createRatingDto: CreateRatingDto,
    @Req() req,
  ) {
    return this.ratingsService.update(id, createRatingDto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string, @Req() req) {
    return this.ratingsService.delete(id, req.user.id);
  }

  @Get('course/:courseId/stats')
  async getCourseRatingStats(@Param('courseId') courseId: string) {
    return this.ratingsService.getCourseRatingStats(courseId);
  }
}
