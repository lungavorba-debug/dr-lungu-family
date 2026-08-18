import type { AuthUser, RoleName, UserProfile } from '@medscreen/types';
import type { UserRecord } from '../repositories/user.repository';

export function toAuthUser(record: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roleName: RoleName;
  mustChangePassword: boolean;
}): AuthUser {
  return {
    id: record.id,
    firstName: record.firstName,
    lastName: record.lastName,
    email: record.email,
    role: record.roleName,
    must_change_password: record.mustChangePassword,
  };
}

export function toUserProfile(record: UserRecord): UserProfile {
  return {
    id: record.id,
    first_name: record.firstName,
    last_name: record.lastName,
    email: record.email,
    role: record.roleName,
    medical_specialty: record.medicalSpecialty,
    professional_title: record.professionalTitle,
    license_number: record.licenseNumber,
    phone: record.phone,
    avatar_image_base64: record.avatarImageBase64,
    avatar_mime_type: record.avatarMimeType,
    signature_image_base64: record.signatureImageBase64,
    signature_mime_type: record.signatureMimeType,
  };
}
