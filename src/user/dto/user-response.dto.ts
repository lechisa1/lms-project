// src/users/dto/user-response.dto.ts
import { Exclude, Expose, Type } from 'class-transformer';

class RoleDto {
  @Expose()
  id: number;

  @Expose()
  name: string;
}

@Exclude()
export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  fullName: string;

  @Expose()
  avatar: string;

  @Expose()
  bio: string;

  @Expose()
  isActive: boolean;

  @Expose()
  lastLoginAt: Date;

  @Expose()
  @Type(() => RoleDto)
  role: RoleDto;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Exclude()
  password: string;

  @Exclude()
  roleId: number;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
    this.fullName = `${this.firstName} ${this.lastName}`;
  }
}
