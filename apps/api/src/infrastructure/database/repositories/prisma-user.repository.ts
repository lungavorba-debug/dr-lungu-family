import { isRoleName } from '@medscreen/shared';
import type { RoleName } from '@medscreen/types';
import type {
  CreateUserData,
  ListUsersParams,
  UpdateUserData,
  UpdateUserProfileData,
  UserCampaignRecord,
  UserRecord,
  UserRepository,
} from '../../../domain/repositories/user.repository';
import { prisma } from '../prisma.client';

function mapUser(record: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  roleId: string;
  active: boolean;
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
  role: { name: string };
}): UserRecord {
  if (!isRoleName(record.role.name)) {
    throw new Error(`Invalid role configured for user: ${record.id}`);
  }

  return {
    id: record.id,
    firstName: record.firstName,
    lastName: record.lastName,
    email: record.email,
    passwordHash: record.passwordHash,
    roleId: record.roleId,
    active: record.active,
    roleName: record.role.name as RoleName,
    createdAt: record.createdAt,
    lastLoginAt: record.lastLoginAt,
    failedLoginAttempts: record.failedLoginAttempts,
    lockedUntil: record.lockedUntil,
    mustChangePassword: record.mustChangePassword,
    passwordChangedAt: record.passwordChangedAt,
    tokenVersion: record.tokenVersion,
    medicalSpecialty: record.medicalSpecialty,
    professionalTitle: record.professionalTitle,
    licenseNumber: record.licenseNumber,
    phone: record.phone,
    avatarImageBase64: record.avatarImageBase64,
    avatarMimeType: record.avatarMimeType,
    signatureImageBase64: record.signatureImageBase64,
    signatureMimeType: record.signatureMimeType,
  };
}

const userInclude = { role: true } as const;

export class PrismaUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<UserRecord | null> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: userInclude,
    });
    return user ? mapUser(user) : null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: userInclude,
    });
    return user ? mapUser(user) : null;
  }

  async findRoleIdByName(roleName: RoleName): Promise<string | null> {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    return role?.id ?? null;
  }

  async create(data: CreateUserData): Promise<UserRecord> {
    const user = await prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        roleId: data.roleId,
        active: data.active ?? true,
        mustChangePassword: data.mustChangePassword ?? true,
        passwordChangedAt: new Date(),
      },
      include: userInclude,
    });

    return mapUser(user);
  }

  async update(id: string, data: UpdateUserData): Promise<UserRecord> {
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
        ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
        ...(data.email !== undefined ? { email: data.email.toLowerCase() } : {}),
        ...(data.roleId !== undefined ? { roleId: data.roleId } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
      },
      include: userInclude,
    });

    return mapUser(user);
  }

  async updateProfile(id: string, data: UpdateUserProfileData): Promise<UserRecord> {
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
        ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
        ...(data.medicalSpecialty !== undefined ? { medicalSpecialty: data.medicalSpecialty } : {}),
        ...(data.professionalTitle !== undefined ? { professionalTitle: data.professionalTitle } : {}),
        ...(data.licenseNumber !== undefined ? { licenseNumber: data.licenseNumber } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.avatarImageBase64 !== undefined ? { avatarImageBase64: data.avatarImageBase64 } : {}),
        ...(data.avatarMimeType !== undefined ? { avatarMimeType: data.avatarMimeType } : {}),
        ...(data.signatureImageBase64 !== undefined
          ? { signatureImageBase64: data.signatureImageBase64 }
          : {}),
        ...(data.signatureMimeType !== undefined ? { signatureMimeType: data.signatureMimeType } : {}),
      },
      include: userInclude,
    });

    return mapUser(user);
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  async updatePasswordWithSessionReset(
    id: string,
    passwordHash: string,
    options?: { mustChangePassword?: boolean },
  ): Promise<UserRecord> {
    const user = await prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        mustChangePassword: options?.mustChangePassword ?? false,
        passwordChangedAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
        tokenVersion: { increment: 1 },
      },
      include: userInclude,
    });

    return mapUser(user);
  }

  async updateLastLogin(id: string, at: Date): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { lastLoginAt: at },
    });
  }

  async recordFailedLogin(id: string, attempts: number, lockedUntil: Date | null): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: {
        failedLoginAttempts: attempts,
        lockedUntil,
      },
    });
  }

  async resetFailedLoginAttempts(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  }

  async unlockAccount(id: string): Promise<UserRecord> {
    const user = await prisma.user.update({
      where: { id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
      include: userInclude,
    });

    return mapUser(user);
  }

  async incrementTokenVersion(id: string): Promise<UserRecord> {
    const user = await prisma.user.update({
      where: { id },
      data: {
        tokenVersion: { increment: 1 },
      },
      include: userInclude,
    });

    return mapUser(user);
  }

  async list(params: ListUsersParams): Promise<{ items: UserRecord[]; total: number }> {
    const where = {
      ...(params.active !== undefined ? { active: params.active } : {}),
      ...(params.roleName
        ? {
            role: {
              name: params.roleName,
            },
          }
        : {}),
      ...(params.search
        ? {
            OR: [
              { firstName: { contains: params.search, mode: 'insensitive' as const } },
              { lastName: { contains: params.search, mode: 'insensitive' as const } },
              { email: { contains: params.search.toLowerCase(), mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: userInclude,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        skip: params.skip,
        take: params.take,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      items: rows.map(mapUser),
      total,
    };
  }

  async getCampaignsForUser(userId: string): Promise<UserCampaignRecord[]> {
    const rows = await prisma.screening.findMany({
      where: { operatorId: userId },
      distinct: ['campaignId'],
      select: {
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        campaign: {
          name: 'asc',
        },
      },
    });

    return rows.map((row) => ({
      id: row.campaign.id,
      name: row.campaign.name,
    }));
  }

  async countActiveByRole(roleName: RoleName): Promise<number> {
    return prisma.user.count({
      where: {
        active: true,
        role: {
          name: roleName,
        },
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }
}
