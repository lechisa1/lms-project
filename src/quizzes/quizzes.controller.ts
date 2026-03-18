import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import {
  CreateQuestionDto,
  CreateQuestionsBulkDto,
} from './dto/create-question.dto';
import { SubmitAttemptDto } from './dto/attempt-quiz.dto';
import {
  QuizResponseDto,
  QuizAttemptResponseDto,
} from './dto/quiz-response.dto';
import { Serialize } from '../common/interceptors/serialize.interceptor';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('quizzes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuizzesController {
  constructor(private readonly quizService: QuizzesService) {}

  // ============ Quiz Management ============

  @Post('lessons/:lessonId')
  @Roles('INSTRUCTOR', 'ADMIN')
  @Serialize(QuizResponseDto)
  async create(
    @Param('lessonId') lessonId: string,
    @Body() createQuizDto: CreateQuizDto,
    @Req() req,
  ) {
    return this.quizService.create(createQuizDto, lessonId, req.user.id);
  }

  @Get('lessons/:lessonId')
  @Serialize(QuizResponseDto)
  async findAll(@Param('lessonId') lessonId: string, @Req() req) {
    return this.quizService.findAll(lessonId, req.user.id, req.user.role);
  }

  @Get(':id')
  @Serialize(QuizResponseDto)
  async findOne(@Param('id') id: string, @Req() req) {
    return this.quizService.findOne(id, req.user.id, req.user.role);
  }

  @Patch(':id')
  @Roles('INSTRUCTOR', 'ADMIN')
  @Serialize(QuizResponseDto)
  async update(
    @Param('id') id: string,
    @Body() updateQuizDto: UpdateQuizDto,
    @Req() req,
  ) {
    return this.quizService.update(
      id,
      updateQuizDto,
      req.user.id,
      req.user.role,
    );
  }

  @Delete(':id')
  @Roles('INSTRUCTOR', 'ADMIN')
  async remove(@Param('id') id: string, @Req() req) {
    return this.quizService.remove(id, req.user.id, req.user.role);
  }

  // ============ Question Management ============

  @Post(':quizId/questions')
  @Roles('INSTRUCTOR', 'ADMIN')
  async addQuestion(
    @Param('quizId') quizId: string,
    @Body() createQuestionDto: CreateQuestionDto,
    @Req() req,
  ) {
    return this.quizService.addQuestion(
      quizId,
      createQuestionDto,
      req.user.id,
      req.user.role,
    );
  }

  @Post(':quizId/questions/bulk')
  @Roles('INSTRUCTOR', 'ADMIN')
  async addQuestionsBulk(
    @Param('quizId') quizId: string,
    @Body() bulkDto: CreateQuestionsBulkDto,
    @Req() req,
  ) {
    return this.quizService.addQuestionsBulk(
      quizId,
      bulkDto,
      req.user.id,
      req.user.role,
    );
  }

  @Patch('questions/:questionId')
  @Roles('INSTRUCTOR', 'ADMIN')
  async updateQuestion(
    @Param('questionId') questionId: string,
    @Body() updateData: any,
    @Req() req,
  ) {
    return this.quizService.updateQuestion(
      questionId,
      updateData,
      req.user.id,
      req.user.role,
    );
  }

  @Delete('questions/:questionId')
  @Roles('INSTRUCTOR', 'ADMIN')
  async removeQuestion(@Param('questionId') questionId: string, @Req() req) {
    return this.quizService.removeQuestion(
      questionId,
      req.user.id,
      req.user.role,
    );
  }

  // ============ Quiz Attempts ============

  @Post(':quizId/attempts/start')
  @Roles('STUDENT')
  async startAttempt(@Param('quizId') quizId: string, @Req() req) {
    return this.quizService.startAttempt(quizId, req.user.id);
  }

  @Post('attempts/:attemptId/submit')
  @Roles('STUDENT')
  @HttpCode(HttpStatus.OK)
  async submitAttempt(
    @Param('attemptId') attemptId: string,
    @Body() submitDto: SubmitAttemptDto,
    @Req() req,
  ) {
    return this.quizService.submitAttempt(attemptId, submitDto, req.user.id);
  }

  @Get('attempts/:attemptId/result')
  @Serialize(QuizAttemptResponseDto)
  async getAttemptResult(@Param('attemptId') attemptId: string, @Req() req) {
    return this.quizService.getAttemptResult(
      attemptId,
      req.user.id,
      req.user.role,
    );
  }

  @Get('students/:studentId/history')
  @Roles('ADMIN', 'STUDENT')
  async getStudentQuizHistory(
    @Param('studentId') studentId: string,
    @Req() req,
  ) {
    return this.quizService.getStudentQuizHistory(
      studentId,
      req.user.id,
      req.user.role,
    );
  }
}
