import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    return this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
      include: {
        role: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      include: {
        role: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          select: {
            name: true,
          },
        },
        enrollments: {
          include: {
            course: true,
          },
        },
        coursesCreated: true,
        lessonsCreated: true,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  async findByRole(roleId: number) {
    return this.prisma.user.findMany({
      where: { roleId },
      include: {
        role: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const data: any = { ...updateUserDto };

    // Handle role update - use Prisma's connect for relation
    if (updateUserDto.roleId) {
      data.role = { connect: { id: updateUserDto.roleId } };
      delete data.roleId;
    }

    // Remove role string if present (it's already converted to roleId in service)
    if (updateUserDto.role) {
      delete data.role;
    }

    // Hash password if it's being updated
    if (updateUserDto.password) {
      data.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      include: {
        role: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async updateLastLogin(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }

  async updateAvatar(id: string, avatarUrl: string) {
    return this.prisma.user.update({
      where: { id },
      data: { avatar: avatarUrl },
    });
  }

  async count() {
    return this.prisma.user.count();
  }

  async countByRole(roleName: string) {
    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
    });
    if (!role) {
      return 0;
    }
    return this.prisma.user.count({
      where: { roleId: role.id },
    });
  }
}
