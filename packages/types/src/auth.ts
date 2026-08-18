export const ROLES = {
  ADMIN: 'ADMIN',
  OPERATOR: 'OPERATOR',
  MEDIC: 'MEDIC',
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

export interface ApiMeta {
  timestamp: string;
  version?: string;
}

export interface ApiSuccessResponse<T> {
  status: 'success';
  code: number;
  message: string;
  data: T;
  meta: ApiMeta;
}

export interface ApiErrorDetail {
  field: string;
  issue: string;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: ApiErrorDetail[];
}

export interface ApiErrorResponse {
  status: 'error';
  code: number;
  error: ApiErrorBody;
  meta: ApiMeta;
}

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: RoleName;
  must_change_password: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponseData {
  token: string;
  role: RoleName;
  full_name: string;
  must_change_password: boolean;
  user: AuthUser;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  success: true;
  email_sent: boolean;
}

export interface ResetPasswordWithTokenRequest {
  token: string;
  password: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: RoleName;
  tv: number;
  iat?: number;
  exp?: number;
}
