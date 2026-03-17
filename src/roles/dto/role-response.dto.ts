// src/roles/dto/role-response.dto.ts
import { Exclude, Expose } from 'class-transformer';

export class RoleResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Exclude()
  users?: any[];

  constructor(partial: Partial<RoleResponseDto>) {
    Object.assign(this, partial);
  }
}
