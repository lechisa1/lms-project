import 'express';

declare module 'express' {
  interface Request {
    user?: {
      id: string;
      email: string;
      roleId: string;
      role: string;
    };
  }
}
