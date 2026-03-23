import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryRepository {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: createCategoryDto,
    });
  }

  async findAll() {
    return this.prisma.category.findMany({
      include: {
        courses: {
          where: { isPublished: true },
          select: {
            id: true,
            title: true,
            thumbnail: true,
            price: true,
            isPublished: true,
            instructor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          take: 10, // Limit to recent 10 courses per category
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    if (!id) {
      return null;
    }
    return this.prisma.category.findUnique({
      where: { id },
      include: {
        courses: {
          where: { isPublished: true },
          include: {
            instructor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  async findByName(name: string) {
    return this.prisma.category.findUnique({
      where: { name },
    });
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  async remove(id: string) {
    // First, check if category has any courses
    //    await this.prisma.category.findUnique({
    //       where: { id },
    //       include: {
    //         courses: true,
    //       },
    //     });

    // if (category?.courses.length > 0) {
    //   // Instead of deleting, you might want to just mark as inactive
    //   // For now, we'll remove the category from courses first
    //   await this.prisma.course.updateMany({
    //     where: { categoryId: id },
    //     data: { categoryId: null },
    //   });
    // }

    return this.prisma.category.delete({
      where: { id },
    });
  }

  async getPopularCategories(limit: number = 10) {
    return this.prisma.category.findMany({
      take: limit,
      include: {
        _count: {
          select: { courses: true },
        },
      },
      orderBy: {
        courses: {
          _count: 'desc',
        },
      },
    });
  }

  async count() {
    return this.prisma.category.count();
  }
}
