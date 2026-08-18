import type { UpdateUserProfileRequest, UserProfileResponse } from '@medscreen/types';
import { toUserProfile } from '../../domain/mappers/user.mapper';
import { AppError } from '../../lib/app-error';
import type { UserRepository } from '../../domain/repositories/user.repository';

export class GetUserProfileUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: string): Promise<UserProfileResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'Utilizatorul nu a fost găsit.');
    }

    return {
      profile: toUserProfile(user),
    };
  }
}

export class UpdateUserProfileUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: string, payload: UpdateUserProfileRequest): Promise<UserProfileResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'Utilizatorul nu a fost găsit.');
    }

    const updated = await this.userRepository.updateProfile(userId, {
      firstName: payload.first_name,
      lastName: payload.last_name,
      medicalSpecialty: payload.medical_specialty,
      professionalTitle: payload.professional_title,
      licenseNumber: payload.license_number,
      phone: payload.phone,
      avatarImageBase64: payload.avatar_image_base64,
      avatarMimeType: payload.avatar_mime_type,
      signatureImageBase64: payload.signature_image_base64,
      signatureMimeType: payload.signature_mime_type,
    });

    return {
      profile: toUserProfile(updated),
    };
  }
}

export class UnlockUserAccountUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'Utilizatorul nu a fost găsit.');
    }

    const updated = await this.userRepository.unlockAccount(userId);

    return {
      user: {
        id: updated.id,
        locked_until: updated.lockedUntil?.toISOString() ?? null,
        failed_login_attempts: updated.failedLoginAttempts,
      },
    };
  }
}
