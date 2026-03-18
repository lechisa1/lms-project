import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ResourceRepository } from './resource.repository';
import { LessonRepository } from '../lessons/lesson.repository';
import { CreateResourceDto } from './dto/create-resource.dto';

@Injectable()
export class ResourcesService {
  constructor(
    private resourceRepository: ResourceRepository,
    private lessonRepository: LessonRepository,
  ) {}

  async create(
    createResourceDto: CreateResourceDto,
    lessonId: string,
    userId: string,
    userRole: string,
  ) {
    const lesson = await this.lessonRepository.findOne(lessonId);

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    if (userRole !== 'ADMIN' && lesson.course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only add resources to your own lessons',
      );
    }

    return this.resourceRepository.create(createResourceDto, lessonId);
  }

  async findAll(lessonId: string, userId: string, userRole: string) {
    const lesson = await this.lessonRepository.findOne(lessonId);

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    // Check access
    if (
      userRole !== 'ADMIN' &&
      lesson.course.instructorId !== userId &&
      !lesson.isPublished
    ) {
      throw new ForbiddenException('You do not have access to these resources');
    }

    return this.resourceRepository.findAll(lessonId);
  }

  async findOne(id: string, userId: string, userRole: string) {
    const resource = await this.resourceRepository.findOne(id);

    if (!resource) {
      throw new NotFoundException(`Resource with ID ${id} not found`);
    }

    // if (
    //   userRole !== 'ADMIN' &&
    //   resource.lesson.course.instructorId !== userId &&
    //   !resource.lesson.isPublished
    // ) {
    //   throw new ForbiddenException('You do not have access to this resource');
    // }

    return resource;
  }

  async remove(id: string, userId: string, userRole: string) {
    const resource = await this.resourceRepository.findOne(id);

    if (!resource) {
      throw new NotFoundException(`Resource with ID ${id} not found`);
    }

    // if (
    //   userRole !== 'ADMIN' &&
    //   resource.lesson.course.instructorId !== userId
    // ) {
    //   throw new ForbiddenException(
    //     'You can only delete resources from your own lessons',
    //   );
    // }

    return this.resourceRepository.remove(id);
  }
}
