// src/categories/category.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CategoryRepository } from './category.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private categoryRepository: CategoryRepository) {}

  async create(createCategoryDto: CreateCategoryDto) {
    // Check if category with same name exists
    const existingCategory = await this.categoryRepository.findByName(
      createCategoryDto.name,
    );
    if (existingCategory) {
      throw new ConflictException(
        `Category with name "${createCategoryDto.name}" already exists`,
      );
    }

    return this.categoryRepository.create(createCategoryDto);
  }

  async findAll() {
    return this.categoryRepository.findAll();
  }

  async findOne(id: string) {
    const category = await this.categoryRepository.findOne(id);
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async findByName(name: string) {
    const category = await this.categoryRepository.findByName(name);
    if (!category) {
      throw new NotFoundException(`Category with name "${name}" not found`);
    }
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    // Check if category exists
    await this.findOne(id);

    // If updating name, check for conflicts
    if (updateCategoryDto.name) {
      const existingCategory = await this.categoryRepository.findByName(
        updateCategoryDto.name,
      );
      if (existingCategory && existingCategory.id !== id) {
        throw new ConflictException(
          `Category with name "${updateCategoryDto.name}" already exists`,
        );
      }
    }

    return this.categoryRepository.update(id, updateCategoryDto);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.categoryRepository.remove(id);
  }

  async getPopularCategories(limit: number = 10) {
    return this.categoryRepository.getPopularCategories(limit);
  }

  async getCategoryStats() {
    const categories = await this.categoryRepository.findAll();

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      courseCount: category.courses?.length || 0,
      recentCourses: category.courses?.slice(0, 5) || [],
    }));
  }
}
