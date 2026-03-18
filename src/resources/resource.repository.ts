import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateResourceDto } from './dto/create-resource.dto';

@Injectable()
export class ResourceRepository {
  constructor(private prisma: PrismaService) {}

  async create(createResourceDto: CreateResourceDto, lessonId: string) {
    return this.prisma.resource.create({
      data: {
        ...createResourceDto,
        lessonId,
      },
    });
  }

  async findAll(lessonId: string) {
    return this.prisma.resource.findMany({
      where: { lessonId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.resource.findUnique({
      where: { id },
      include: {
        lesson: true,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.resource.delete({
      where: { id },
    });
  }

  async removeAll(lessonId: string) {
    return this.prisma.resource.deleteMany({
      where: { lessonId },
    });
  }
}
