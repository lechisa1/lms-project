// src/roles/role.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { DEFAULT_ROLES } from './interfaces/role.interface';

@Injectable()
export class RoleRepository {
  constructor(private prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto) {
    return await this.prisma.role.create({
      data: createRoleDto,
    });
  }

  async findAll() {
    return this.prisma.role.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: number) {
    return  await this.prisma.role.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async findByName(name: string) {
    return this.prisma.role.findUnique({
      where: { name },
    });
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    return this.prisma.role.update({
      where: { id },
      data: updateRoleDto,
    });
  }

  async remove(id: number) {
    return this.prisma.role.delete({
      where: { id },
    });
  }

  async initializeDefaultRoles() {
    const defaultRoles = Object.values(DEFAULT_ROLES);

    for (const roleName of defaultRoles) {
      const existingRole = await this.findByName(roleName);
      if (!existingRole) {
        await this.create({ name: roleName });
      }
    }
  }

  async count() {
    return this.prisma.role.count();
  }
}
