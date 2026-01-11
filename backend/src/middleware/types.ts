import { Request } from 'express';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: 'CREATOR' | 'EDITOR' | 'ADMIN';
  params: any;
  body: any;
}

