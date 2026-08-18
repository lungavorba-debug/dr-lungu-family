import type { InitialSetupRequest, LoginResponseData, SetupStatusResponse } from '@medscreen/types';
import { ROLES } from '@medscreen/types';
import { toAuthUser } from '../../domain/mappers/user.mapper';
import type { UserRepository } from '../../domain/repositories/user.repository';
import { AppError } from '../../lib/app-error';
import { jwtService } from '../../infrastructure/auth/jwt.service';
import { passwordService } from '../../infrastructure/auth/password.service';
import { isSetupRequired } from '../users/last-admin-guard';

export class GetSetupStatusUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(): Promise<SetupStatusResponse> {
    return {
      setup_required: await isSetupRequired(this.userRepository),
    };
  }
}

export class CreateInitialAdminUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(payload: InitialSetupRequest): Promise<LoginResponseData> {
    if (!(await isSetupRequired(this.userRepository))) {
      throw new AppError(
        409,
        'SETUP_ALREADY_COMPLETED',
        'Configurarea inițială a fost deja finalizată.',
      );
    }

    const existing = await this.userRepository.findByEmail(payload.email);
    if (existing) {
      throw new AppError(409, 'CONFLICT', 'Există deja un utilizator cu acest email.', [
        { field: 'email', issue: 'Adresa de email este deja folosită.' },
      ]);
    }

    const roleId = await this.userRepository.findRoleIdByName(ROLES.ADMIN);
    if (!roleId) {
      throw new AppError(500, 'INTERNAL_ERROR', 'Rolul de administrator nu este configurat.');
    }

    const passwordHash = await passwordService.hash(payload.password);
    const user = await this.userRepository.create({
      firstName: payload.first_name,
      lastName: payload.last_name,
      email: payload.email,
      passwordHash,
      roleId,
      active: true,
      mustChangePassword: false,
    });

    const authUser = toAuthUser(user);
    const token = jwtService.sign(authUser, user.tokenVersion);

    await this.userRepository.updateLastLogin(user.id, new Date());

    return {
      token,
      role: authUser.role,
      full_name: `${authUser.firstName} ${authUser.lastName}`,
      must_change_password: authUser.must_change_password,
      user: authUser,
    };
  }
}
