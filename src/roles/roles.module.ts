// src/roles/role.module.ts
import { Module, OnModuleInit } from '@nestjs/common';
import { RoleService } from './roles.service';
import { RoleController } from './roles.controller';
import { RoleRepository } from './role.repository';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [RoleController],
  providers: [RoleService, RoleRepository, PrismaService],
  exports: [RoleService, RoleRepository],
})
export class RoleModule implements OnModuleInit {
  constructor(private roleRepository: RoleRepository) {}

  async onModuleInit() {
    // Initialize default roles when module starts
    await this.roleRepository.initializeDefaultRoles();
  }
}
