// src/resources/resource.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('lessons/:lessonId/resources')
export class ResourcesController {
  constructor(private readonly resourceService: ResourcesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INSTRUCTOR', 'ADMIN')
  @UseInterceptors(
    FileInterceptor('file', {
      dest: './uploads',
    }),
  )
  async create(
    @Param('lessonId') lessonId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Req() req,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const createResourceDto: CreateResourceDto = {
      title: body.title || file.originalname,
      type: body.type || file.mimetype.split('/')[0].toUpperCase(),
      url: `/uploads/${file.filename}`, // ✅ FIXED
      fileSize: file.size,
      mimeType: file.mimetype,
    };

    return this.resourceService.create(
      createResourceDto,
      lessonId,
      req.user.id,
      req.user.role,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Param('lessonId') lessonId: string, @Req() req) {
    return this.resourceService.findAll(lessonId, req.user.id, req.user.role);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string, @Req() req) {
    return this.resourceService.findOne(id, req.user.id, req.user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INSTRUCTOR', 'ADMIN')
  async remove(@Param('id') id: string, @Req() req) {
    return this.resourceService.remove(id, req.user.id, req.user.role);
  }
}
