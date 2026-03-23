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

    const user = await this.userRepository.create(createUserDto);
    // Transform role from object to string
    return {
      ...user,
      role: user.role?.name,
    };
  }

  async findAll() {
    const users = await this.userRepository.findAll();
    // Transform role from object to string
    return users.map((user) => ({
      ...user,
      role: user.role?.name,
    }));
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    // Transform role from object to string
    return {
      ...user,
      role: user.role?.name,
    };
  }

  async findByEmail(email: string) {
    const user = await this.userRepository.findByEmail(email);
    if (user) {
      // Transform role from object to string
      return {
        ...user,
        role: user.role?.name,
      };
    }
    return null;
  }

  async findByRole(roleId: number) {
    const role = await this.roleRepository.findOne(roleId);
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }
    const users = await this.userRepository.findByRole(roleId);
    // Transform role from object to string
    return users.map((user) => ({
      ...user,
      role: user.role?.name,
    }));
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    requestingUserId?: string,
  ) {
    const user = await this.findOne(id);

    // If updating role by name (e.g., 'STUDENT'), convert to roleId
    if (updateUserDto.role) {
      const role = await this.roleRepository.findByName(updateUserDto.role);
      if (!role) {
        throw new NotFoundException(
          `Role with name '${updateUserDto.role}' not found`,
        );
      }
      updateUserDto.roleId = role.id;
    }

    // If roleId is provided, verify it exists
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

    const updatedUser = await this.userRepository.update(id, updateUserDto);
    // Transform role from object to string
    return {
      ...updatedUser,
      role: updatedUser.role?.name,
    };
  }

  async updateProfile(id: string, updateProfileDto: UpdateProfileDto) {
    await this.findOne(id);
    const updatedUser = await this.userRepository.update(id, updateProfileDto);
    // Transform role from object to string
    return {
      ...updatedUser,
      role: updatedUser.role?.name,
    };
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
