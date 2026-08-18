import type { RoleName } from './auth';

export interface UserCampaignSummary {
  id: string;
  name: string;
}

export interface AdminUserListItem {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: RoleName;
  active: boolean;
  locked_until: string | null;
  failed_login_attempts: number;
  must_change_password: boolean;
  created_at: string;
  last_login_at: string | null;
  campaigns: UserCampaignSummary[];
}

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: RoleName;
  medical_specialty: string | null;
  professional_title: string | null;
  license_number: string | null;
  phone: string | null;
  avatar_image_base64: string | null;
  avatar_mime_type: string | null;
  signature_image_base64: string | null;
  signature_mime_type: string | null;
}

export interface UpdateUserProfileRequest {
  first_name?: string;
  last_name?: string;
  medical_specialty?: string | null;
  professional_title?: string | null;
  license_number?: string | null;
  phone?: string | null;
  avatar_image_base64?: string | null;
  avatar_mime_type?: string | null;
  signature_image_base64?: string | null;
  signature_mime_type?: string | null;
}

export interface UserProfileResponse {
  profile: UserProfile;
}

export interface ListUsersResponse {
  users: AdminUserListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateUserRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: RoleName;
}

export interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: RoleName;
}

export interface ResetUserPasswordRequest {
  password: string;
}

export interface UserAdminResponse {
  user: AdminUserListItem;
}

export interface SetupStatusResponse {
  setup_required: boolean;
}

export interface InitialSetupRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}
