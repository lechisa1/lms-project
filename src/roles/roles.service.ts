// src/roles/role.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { RoleRepository } from './role.repository';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { DEFAULT_ROLES } from './interfaces/role.interface';

@Injectable()
export class RoleService {
  constructor(private roleRepository: RoleRepository) {}

  async create(createRoleDto: CreateRoleDto) {
    // Check if role with same name exists
    const existingRole = await this.roleRepository.findByName(
      createRoleDto.name,
    );
    if (existingRole) {
      throw new ConflictException(
        `Role with name ${createRoleDto.name} already exists`,
      );
    }

    return this.roleRepository.create(createRoleDto);
  }

  async findAll() {
    return this.roleRepository.findAll();
  }

  async findOne(id: number) {
    const role = await this.roleRepository.findOne(id);
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return role;
  }

  async findByName(name: string) {
    return this.roleRepository.findByName(name);
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    // Check if role exists
    await this.findOne(id);

    // If updating name, check for conflicts
    if (updateRoleDto.name) {
      const existingRole = await this.roleRepository.findByName(
        updateRoleDto.name,
      );
      if (existingRole && existingRole.id !== id) {
        throw new ConflictException(
          `Role with name ${updateRoleDto.name} already exists`,
        );
      }
    }

    return this.roleRepository.update(id, updateRoleDto);
  }

  async remove(id: number) {
    const role = await this.findOne(id);

    // Prevent deletion of default roles
    if (Object.values(DEFAULT_ROLES).includes(role.name as any)) {
      throw new BadRequestException(`Cannot delete default role: ${role.name}`);
    }

    return this.roleRepository.remove(id);
  }

//   async getDefaultRoles() {
//     const roles = [];
//     for (const roleName of Object.values(DEFAULT_ROLES)) {
//       const role = await this.roleRepository.findByName(roleName);
//       if (role) {
//         roles.push(role);
//       }
//     }
//     return roles;
//   }
}
