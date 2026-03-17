// src/roles/role.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { RoleService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleResponseDto } from './dto/role-response.dto';
import { Serialize } from 'src/common/interceptors/serialize.interceptor';

@Controller('roles')
@Serialize(RoleResponseDto)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  async create(@Body() createRoleDto: CreateRoleDto) {
    return this.roleService.create(createRoleDto);
  }

  @Get()
  async findAll() {
    return this.roleService.findAll();
  }

  //   @Get('default')
  //   async getDefaultRoles() {
  //     return this.roleService.getDefaultRoles();
  //   }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.findOne(id);
  }

  @Get('name/:name')
  async findByName(@Param('name') name: string) {
    return this.roleService.findByName(name);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.roleService.update(id, updateRoleDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.remove(id);
  }
}
