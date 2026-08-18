import type { RoleName } from '@medscreen/types';

export interface UserRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  roleId: string;
  active: boolean;
  roleName: RoleName;
  createdAt: Date;
  lastLoginAt: Date | null;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  mustChangePassword: boolean;
  passwordChangedAt: Date | null;
  tokenVersion: number;
  medicalSpecialty: string | null;
  professionalTitle: string | null;
  licenseNumber: string | null;
  phone: string | null;
  avatarImageBase64: string | null;
  avatarMimeType: string | null;
  signatureImageBase64: string | null;
  signatureMimeType: string | null;
}

export interface UserCampaignRecord {
  id: string;
  name: string;
}

export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  roleId: string;
  active?: boolean;
  mustChangePassword?: boolean;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  roleId?: string;
  active?: boolean;
}

export interface UpdateUserProfileData {
  firstName?: string;
  lastName?: string;
  medicalSpecialty?: string | null;
  professionalTitle?: string | null;
  licenseNumber?: string | null;
  phone?: string | null;
  avatarImageBase64?: string | null;
  avatarMimeType?: string | null;
  signatureImageBase64?: string | null;
  signatureMimeType?: string | null;
}

export interface ListUsersParams {
  search?: string;
  roleName?: RoleName;
  active?: boolean;
  skip: number;
  take: number;
}

export interface UserRepository {
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  findRoleIdByName(roleName: RoleName): Promise<string | null>;
  create(data: CreateUserData): Promise<UserRecord>;
  update(id: string, data: UpdateUserData): Promise<UserRecord>;
  updateProfile(id: string, data: UpdateUserProfileData): Promise<UserRecord>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
  updatePasswordWithSessionReset(
    id: string,
    passwordHash: string,
    options?: { mustChangePassword?: boolean },
  ): Promise<UserRecord>;
  updateLastLogin(id: string, at: Date): Promise<void>;
  recordFailedLogin(id: string, attempts: number, lockedUntil: Date | null): Promise<void>;
  resetFailedLoginAttempts(id: string): Promise<void>;
  unlockAccount(id: string): Promise<UserRecord>;
  incrementTokenVersion(id: string): Promise<UserRecord>;
  list(params: ListUsersParams): Promise<{ items: UserRecord[]; total: number }>;
  getCampaignsForUser(userId: string): Promise<UserCampaignRecord[]>;
  countActiveByRole(roleName: RoleName): Promise<number>;
  delete(id: string): Promise<void>;
}
