import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { QuizRepository } from './quiz.repository';
import { QuizAttemptRepository } from './quiz-attempt.repository';
import { LessonRepository } from '../lessons/lesson.repository';
import { EnrollmentRepository } from '../enrollments/enrollment.repository';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import {
  CreateQuestionDto,
  CreateQuestionsBulkDto,
} from './dto/create-question.dto';
import { SubmitAttemptDto } from './dto/attempt-quiz.dto';

@Injectable()
export class QuizzesService {
  constructor(
    private quizRepository: QuizRepository,
    private quizAttemptRepository: QuizAttemptRepository,
    private lessonRepository: LessonRepository,
    private enrollmentRepository: EnrollmentRepository,
  ) {}

  async create(
    createQuizDto: CreateQuizDto,
    lessonId: string,
    instructorId: string,
  ) {
    // Verify lesson exists and belongs to instructor
    const lesson = await this.lessonRepository.findOne(lessonId);
    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    if (lesson.course.instructorId !== instructorId) {
      throw new ForbiddenException(
        'You can only add quizzes to your own lessons',
      );
    }

    return this.quizRepository.create(createQuizDto, lessonId, instructorId);
  }

  async findAll(lessonId: string, userId: string, userRole: string) {
    const lesson = await this.lessonRepository.findOne(lessonId);
    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    // Check permissions
    const isAdmin = userRole === 'ADMIN';
    const isInstructor =
      userRole === 'INSTRUCTOR' && lesson.course.instructorId === userId;
    const isEnrolled =
      await this.enrollmentRepository.findOneByStudentAndCourse(
        userId,
        lesson.courseId,
      );

    if (!isAdmin && !isInstructor && !isEnrolled) {
      throw new ForbiddenException('You do not have access to these quizzes');
    }

    return this.quizRepository.findAll(lessonId);
  }

  async findOne(id: string, userId: string, userRole: string) {
    const quiz = await this.quizRepository.findOne(id);

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }

    // Check permissions
    const isAdmin = userRole === 'ADMIN';
    const isInstructor =
      userRole === 'INSTRUCTOR' && quiz.lesson.course.instructorId === userId;
    const isEnrolled =
      await this.enrollmentRepository.findOneByStudentAndCourse(
        userId,
        quiz.lesson.courseId,
      );

    if (!isAdmin && !isInstructor && !isEnrolled) {
      throw new ForbiddenException('You do not have access to this quiz');
    }

    return quiz;
  }

  async update(
    id: string,
    updateQuizDto: UpdateQuizDto,
    userId: string,
    userRole: string,
  ) {
    const quiz = await this.quizRepository.findOne(id);

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }

    if (userRole !== 'ADMIN' && quiz.lesson.course.instructorId !== userId) {
      throw new ForbiddenException('You can only update your own quizzes');
    }

    return this.quizRepository.update(id, updateQuizDto);
  }

  async remove(id: string, userId: string, userRole: string) {
    const quiz = await this.quizRepository.findOne(id);

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }

    if (userRole !== 'ADMIN' && quiz.lesson.course.instructorId !== userId) {
      throw new ForbiddenException('You can only delete your own quizzes');
    }

    return this.quizRepository.remove(id);
  }

  async addQuestion(
    quizId: string,
    createQuestionDto: CreateQuestionDto,
    userId: string,
    userRole: string,
  ) {
    const quiz = await this.quizRepository.findOne(quizId);

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${quizId} not found`);
    }

    if (userRole !== 'ADMIN' && quiz.lesson.course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only add questions to your own quizzes',
      );
    }

    // Validate options based on question type
    this.validateQuestionOptions(createQuestionDto);

    return this.quizRepository.addQuestion(quizId, createQuestionDto);
  }

  async addQuestionsBulk(
    quizId: string,
    bulkDto: CreateQuestionsBulkDto,
    userId: string,
    userRole: string,
  ) {
    const quiz = await this.quizRepository.findOne(quizId);

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${quizId} not found`);
    }

    if (userRole !== 'ADMIN' && quiz.lesson.course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only add questions to your own quizzes',
      );
    }

    // Validate each question
    bulkDto.questions.forEach((q) => this.validateQuestionOptions(q));

    return this.quizRepository.addQuestionsBulk(quizId, bulkDto.questions);
  }

  async updateQuestion(
    questionId: string,
    updateData: any,
    userId: string,
    userRole: string,
  ) {
    const quiz = await this.quizRepository.findOne(questionId);
    // Note: You'll need to get quiz from question ID - consider adding a method to find quiz by question

    // For now, we'll assume we have the quiz
    if (userRole !== 'ADMIN') {
      // Check if user is instructor of the course
      // This needs implementation
    }

    return this.quizRepository.updateQuestion(questionId, updateData);
  }

  async removeQuestion(questionId: string, userId: string, userRole: string) {
    // Similar permission check needed
    return this.quizRepository.removeQuestion(questionId);
  }

  async startAttempt(quizId: string, studentId: string) {
    const quiz = await this.quizRepository.findOne(quizId);

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${quizId} not found`);
    }

    // Check if student is enrolled in the course
    const enrollment =
      await this.enrollmentRepository.findOneByStudentAndCourse(
        studentId,
        quiz.lesson.courseId,
      );

    if (!enrollment) {
      throw new ForbiddenException(
        'You must be enrolled in the course to take this quiz',
      );
    }

    // Check attempt limits
    const attemptsCount = await this.quizRepository.countUserAttempts(
      quizId,
      studentId,
    );
    if (attemptsCount >= quiz.maxAttempts) {
      throw new ConflictException(
        `Maximum attempts (${quiz.maxAttempts}) reached for this quiz`,
      );
    }

    // Check if already passed
    const hasPassed = await this.quizAttemptRepository.hasPassedQuiz(
      quizId,
      studentId,
    );
    if (hasPassed) {
      throw new ConflictException('You have already passed this quiz');
    }

    return this.quizAttemptRepository.create(quizId, studentId);
  }

  async submitAttempt(
    attemptId: string,
    submitDto: SubmitAttemptDto,
    studentId: string,
  ) {
    const attempt = await this.quizAttemptRepository.findOne(attemptId);

    if (!attempt) {
      throw new NotFoundException(`Attempt with ID ${attemptId} not found`);
    }

    if (attempt.studentId !== studentId) {
      throw new ForbiddenException('You can only submit your own attempts');
    }

    if (attempt.completedAt) {
      throw new ConflictException('This attempt has already been submitted');
    }

    // Grade the attempt
    const { score, passed, answers } = await this.gradeAttempt(
      attempt,
      submitDto.answers,
    );

    // Submit the attempt
    return this.quizAttemptRepository.submitAttempt(
      attemptId,
      score,
      passed,
      answers,
    );
  }

  async getAttemptResult(attemptId: string, userId: string, userRole: string) {
    const attempt = await this.quizAttemptRepository.findOne(attemptId);

    if (!attempt) {
      throw new NotFoundException(`Attempt with ID ${attemptId} not found`);
    }

    // Check permissions
    const isAdmin = userRole === 'ADMIN';
    const isInstructor =
      userRole === 'INSTRUCTOR' &&
      attempt.quiz.lesson.course.instructorId === userId;
    const isStudent = attempt.studentId === userId;

    if (!isAdmin && !isInstructor && !isStudent) {
      throw new ForbiddenException('You do not have access to this attempt');
    }

    return attempt;
  }

  async getStudentQuizHistory(
    studentId: string,
    requestingUserId: string,
    userRole: string,
  ) {
    if (userRole !== 'ADMIN' && studentId !== requestingUserId) {
      throw new ForbiddenException('You can only view your own quiz history');
    }

    return this.quizAttemptRepository.findByStudent(studentId);
  }

  private async gradeAttempt(
    attempt: any,
    submittedAnswers: { questionId: string; answer: string }[],
  ) {
    const quiz = attempt.quiz;
    const questions = quiz.questions;
    let totalPoints = 0;
    let earnedPoints = 0;

    const gradedAnswers: {
      questionId: string;
      answer: string;
      isCorrect: boolean;
    }[] = [];

    for (const question of questions) {
      totalPoints += question.points || 1;

      const submittedAnswer = submittedAnswers.find(
        (a) => a.questionId === question.id,
      );

      if (!submittedAnswer) {
        gradedAnswers.push({
          questionId: question.id,
          answer: '',
          isCorrect: false,
        });
        continue;
      }

      let isCorrect = false;

      switch (question.type) {
        case 'MULTIPLE_CHOICE':
        case 'SINGLE_CHOICE':
        case 'TRUE_FALSE':
          const selectedOption = question.options.find(
            (o) => o.id === submittedAnswer.answer,
          );
          isCorrect = selectedOption?.isCorrect || false;
          break;

        case 'SHORT_ANSWER':
          const correctOption = question.options.find((o) => o.isCorrect);
          isCorrect =
            correctOption?.text.toLowerCase() ===
            submittedAnswer.answer.toLowerCase();
          break;
      }

      if (isCorrect) {
        earnedPoints += question.points || 1;
      }

      gradedAnswers.push({
        questionId: question.id,
        answer: submittedAnswer.answer,
        isCorrect,
      });
    }

    const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const passed = score >= (quiz.passingScore || 70);

    return {
      score,
      passed,
      answers: gradedAnswers,
    };
  }

  private validateQuestionOptions(questionDto: CreateQuestionDto) {
    switch (questionDto.type) {
      case 'MULTIPLE_CHOICE':
        if (!questionDto.options || questionDto.options.length < 2) {
          throw new BadRequestException(
            'Multiple choice questions must have at least 2 options',
          );
        }
        const correctCount = questionDto.options.filter(
          (o) => o.isCorrect,
        ).length;
        if (correctCount < 1) {
          throw new BadRequestException(
            'Multiple choice questions must have at least one correct answer',
          );
        }
        break;

      case 'SINGLE_CHOICE':
        if (!questionDto.options || questionDto.options.length < 2) {
          throw new BadRequestException(
            'Single choice questions must have at least 2 options',
          );
        }
        const singleCorrectCount = questionDto.options.filter(
          (o) => o.isCorrect,
        ).length;
        if (singleCorrectCount !== 1) {
          throw new BadRequestException(
            'Single choice questions must have exactly one correct answer',
          );
        }
        break;

      case 'TRUE_FALSE':
        if (!questionDto.options || questionDto.options.length !== 2) {
          throw new BadRequestException(
            'True/False questions must have exactly 2 options',
          );
        }
        const tfCorrectCount = questionDto.options.filter(
          (o) => o.isCorrect,
        ).length;
        if (tfCorrectCount !== 1) {
          throw new BadRequestException(
            'True/False questions must have exactly one correct answer',
          );
        }
        break;

      case 'SHORT_ANSWER':
        if (!questionDto.options || questionDto.options.length !== 1) {
          throw new BadRequestException(
            'Short answer questions must have exactly one correct answer option',
          );
        }
        break;
    }
  }
}
