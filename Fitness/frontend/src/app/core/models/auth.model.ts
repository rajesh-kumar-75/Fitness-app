export type UserRole = 'USER' | 'TRAINER' | 'ADMIN';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponseData {
  user: User;
  token: string;
}

export interface AuthResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: AuthResponseData;
}

export interface UserProfileResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    user: User;
  };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}
