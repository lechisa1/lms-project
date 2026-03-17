import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Req,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, UpdateProfileDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { Serialize } from '../common/interceptors/serialize.interceptor';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import type { Request } from 'express';

@Controller('users')
@Serialize(UserResponseDto)
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles('ADMIN')
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  //   @Roles('ADMIN')
  async findAll() {
    return this.userService.findAll();
  }

  @Get('instructors')
  async getInstructors() {
    return this.userService.getInstructors();
  }

  @Get('students')
  async getStudents() {
    return this.userService.getStudents();
  }

  @Get('profile')
  async getProfile(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.userService.findOne(userId);
  }

  @Patch('profile')
  async updateProfile(
    @Req() req: Request,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const userId = (req.user as any).id;
    return this.userService.updateProfile(userId, updateProfileDto);
  }

  @Post('profile/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Here you would upload to cloud storage and get URL
    // For now, we'll just return the file info
    const userId = (req.user as any).id;
    // const avatarUrl = await this.uploadService.upload(file);
    const avatarUrl = file.path; // Temporary
    return this.userService.updateAvatar(userId, avatarUrl);
  }

  @Post('profile/change-password')
  async changePassword(
    @Req() req: Request,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const userId = (req.user as any).id;
    return this.userService.changePassword(userId, changePasswordDto);
  }

  @Get('role/:roleId')
  @Roles('ADMIN')
  async findByRole(@Param('roleId', ParseIntPipe) roleId: number) {
    return this.userService.findByRole(roleId);
  }

  @Get(':id')
  @Roles('ADMIN')
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: Request,
  ) {
    const requestingUserId = (req.user as any).id;
    return this.userService.update(id, updateUserDto, requestingUserId);
  }

  @Delete(':id')
  @Roles('ADMIN')
  async remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
