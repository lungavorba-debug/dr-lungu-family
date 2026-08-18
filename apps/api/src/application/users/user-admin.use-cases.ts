import type {
  AdminUserListItem,
  CreateUserRequest,
  ListUsersResponse,
  ResetUserPasswordRequest,
  UpdateUserRequest,
  UserAdminResponse,
} from '@medscreen/types';
import { AppError } from '../../lib/app-error';
import type { UserRecord, UserRepository } from '../../domain/repositories/user.repository';
import { passwordService } from '../../infrastructure/auth/password.service';
import {
  assertNotLastActiveAdmin,
  isAdminRoleDemotion,
} from './last-admin-guard';

async function toAdminUserListItem(
  userRepository: UserRepository,
  user: UserRecord,
): Promise<AdminUserListItem> {
  const campaigns = await userRepository.getCampaignsForUser(user.id);

  return {
    id: user.id,
    first_name: user.firstName,
    last_name: user.lastName,
    email: user.email,
    role: user.roleName,
    active: user.active,
    locked_until: user.lockedUntil?.toISOString() ?? null,
    failed_login_attempts: user.failedLoginAttempts,
    must_change_password: user.mustChangePassword,
    created_at: user.createdAt.toISOString(),
    last_login_at: user.lastLoginAt?.toISOString() ?? null,
    campaigns,
  };
}

export class ListUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(params: {
    search?: string;
    role?: AdminUserListItem['role'];
    active?: boolean;
    page: number;
    limit: number;
  }): Promise<ListUsersResponse> {
    const skip = (params.page - 1) * params.limit;
    const result = await this.userRepository.list({
      search: params.search,
      roleName: params.role,
      active: params.active,
      skip,
      take: params.limit,
    });

    const users = await Promise.all(
      result.items.map((user) => toAdminUserListItem(this.userRepository, user)),
    );

    return {
      users,
      total: result.total,
      page: params.page,
      limit: params.limit,
    };
  }
}

export class GetUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: string): Promise<UserAdminResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'Utilizatorul nu a fost găsit.');
    }

    return {
      user: await toAdminUserListItem(this.userRepository, user),
    };
  }
}

export class CreateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(payload: CreateUserRequest): Promise<UserAdminResponse> {
    const existing = await this.userRepository.findByEmail(payload.email);
    if (existing) {
      throw new AppError(409, 'CONFLICT', 'Există deja un utilizator cu acest email.', [
        { field: 'email', issue: 'Adresa de email este deja folosită.' },
      ]);
    }

    const roleId = await this.userRepository.findRoleIdByName(payload.role);
    if (!roleId) {
      throw new AppError(400, 'INVALID_PARAMETER', 'Rolul selectat nu este valid.', [
        { field: 'role', issue: 'Rol necunoscut.' },
      ]);
    }

    const passwordHash = await passwordService.hash(payload.password);
    const user = await this.userRepository.create({
      firstName: payload.first_name,
      lastName: payload.last_name,
      email: payload.email,
      passwordHash,
      roleId,
      active: true,
      mustChangePassword: true,
    });

    return {
      user: await toAdminUserListItem(this.userRepository, user),
    };
  }
}

export class UpdateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: string, payload: UpdateUserRequest): Promise<UserAdminResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'Utilizatorul nu a fost găsit.');
    }

    if (payload.email && payload.email.toLowerCase() !== user.email) {
      const existing = await this.userRepository.findByEmail(payload.email);
      if (existing && existing.id !== userId) {
        throw new AppError(409, 'CONFLICT', 'Există deja un utilizator cu acest email.', [
          { field: 'email', issue: 'Adresa de email este deja folosită.' },
        ]);
      }
    }

    let roleId: string | undefined;
    if (payload.role) {
      const resolvedRoleId = await this.userRepository.findRoleIdByName(payload.role);
      if (!resolvedRoleId) {
        throw new AppError(400, 'INVALID_PARAMETER', 'Rolul selectat nu este valid.', [
          { field: 'role', issue: 'Rol necunoscut.' },
        ]);
      }

      if (isAdminRoleDemotion(user.roleName, payload.role)) {
        await assertNotLastActiveAdmin(this.userRepository, user, 'demote');
      }

      roleId = resolvedRoleId;
    }

    const updated = await this.userRepository.update(userId, {
      firstName: payload.first_name,
      lastName: payload.last_name,
      email: payload.email,
      roleId,
    });

    return {
      user: await toAdminUserListItem(this.userRepository, updated),
    };
  }
}

export class SetUserActiveUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(params: { userId: string; active: boolean; actorId: string }) {
    if (params.userId === params.actorId && !params.active) {
      throw new AppError(400, 'INVALID_PARAMETER', 'Nu vă puteți dezactiva propriul cont.');
    }

    const user = await this.userRepository.findById(params.userId);
    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'Utilizatorul nu a fost găsit.');
    }

    if (!params.active) {
      await assertNotLastActiveAdmin(this.userRepository, user, 'deactivate');
    }

    const updated = await this.userRepository.update(params.userId, { active: params.active });

    return {
      user: await toAdminUserListItem(this.userRepository, updated),
    };
  }
}

export class ResetUserPasswordUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: string, payload: ResetUserPasswordRequest): Promise<{ success: true }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'Utilizatorul nu a fost găsit.');
    }

    const passwordHash = await passwordService.hash(payload.password);
    await this.userRepository.updatePasswordWithSessionReset(userId, passwordHash, {
      mustChangePassword: true,
    });

    return { success: true };
  }
}

export class DeleteUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(params: { userId: string; actorId: string }): Promise<{ success: true }> {
    if (params.userId === params.actorId) {
      throw new AppError(400, 'INVALID_PARAMETER', 'Nu vă puteți șterge propriul cont.');
    }

    const user = await this.userRepository.findById(params.userId);
    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'Utilizatorul nu a fost găsit.');
    }

    await assertNotLastActiveAdmin(this.userRepository, user, 'delete');

    await this.userRepository.delete(params.userId);

    return { success: true };
  }
}
