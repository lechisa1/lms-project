// src/roles/interfaces/role.interface.ts
export interface Role {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_ROLES = {
  ADMIN: 'ADMIN',
  INSTRUCTOR: 'INSTRUCTOR',
  STUDENT: 'STUDENT',
} as const;

export type DefaultRole = (typeof DEFAULT_ROLES)[keyof typeof DEFAULT_ROLES];
