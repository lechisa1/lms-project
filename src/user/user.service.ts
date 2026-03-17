import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { UserRepository } from './user.repository';
import { RoleRepository } from '../roles/role.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, UpdateProfileDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private roleRepository: RoleRepository,
  ) {}

  async create(createUserDto: CreateUserDto) {
    // Check if user exists
    const existingUser = await this.userRepository.findByEmail(
      createUserDto.email,
    );
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Verify role exists
    const role = await this.roleRepository.findOne(createUserDto.roleId);
    if (!role) {
      throw new NotFoundException(
        `Role with ID ${createUserDto.roleId} not found`,
      );
    }

    return this.userRepository.create(createUserDto);
  }

  async findAll() {
    return this.userRepository.findAll();
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string) {
    return this.userRepository.findByEmail(email);
  }

  async findByRole(roleId: number) {
    const role = await this.roleRepository.findOne(roleId);
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }
    return this.userRepository.findByRole(roleId);
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    requestingUserId?: string,
  ) {
    const user = await this.findOne(id);

    // If updating role, check if role exists
    if (updateUserDto.roleId) {
      const role = await this.roleRepository.findOne(updateUserDto.roleId);
      if (!role) {
        throw new NotFoundException(
          `Role with ID ${updateUserDto.roleId} not found`,
        );
      }
    }

    // If updating email, check if it's taken
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(
        updateUserDto.email,
      );
      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    }

    return this.userRepository.update(id, updateUserDto);
  }

  async updateProfile(id: string, updateProfileDto: UpdateProfileDto) {
    await this.findOne(id);
    return this.userRepository.update(id, updateProfileDto);
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.userRepository.findOne(id);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new ForbiddenException('Current password is incorrect');
    }

    return this.userRepository.update(id, {
      password: changePasswordDto.newPassword,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.userRepository.remove(id);
  }

  async updateAvatar(id: string, avatarUrl: string) {
    await this.findOne(id);
    return this.userRepository.updateAvatar(id, avatarUrl);
  }

  async getInstructors() {
    const instructorRole = await this.roleRepository.findByName('INSTRUCTOR');
    console.log(instructorRole);
    if (!instructorRole) {
      return [];
    }
    console.log(this.userRepository.findByRole(instructorRole.id));
    return this.userRepository.findByRole(instructorRole.id);
  }

  async getStudents() {
    const studentRole = await this.roleRepository.findByName('STUDENT');
    if (!studentRole) {
      return [];
    }
    return this.userRepository.findByRole(studentRole.id);
  }
}
