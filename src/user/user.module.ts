import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoleRepository } from 'src/roles/role.repository';
import { UserRepository } from './user.repository';
import { RoleModule } from 'src/roles/roles.module';

@Module({
  imports: [RoleModule],
  controllers: [UserController],
  providers: [UserService, UserRepository, RoleRepository, PrismaService],
  exports: [UserService, UserRepository],
})
export class UserModule {}
