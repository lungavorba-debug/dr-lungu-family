import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  Campaign,
  CampaignAdminResponse,
  CampaignDashboardSummary,
  CreateCampaignRequest,
  ListCampaignsAdminResponse,
  UpdateCampaignRequest,
  ClinicalEvaluationRequest,
  ClinicalEvaluationResponse,
  ClinicalRuleResponse,
  ClinicSettingsResponse,
  CreateClinicalRuleRequest,
  ListClinicalRuleChangesResponse,
  ListClinicalRulesResponse,
  PreviewClinicalEvaluationResponse,
  PublicClinicSettingsResponse,
  UpdateClinicalRuleRequest,
  UpdateClinicSettingsSectionRequest,
  UploadBrandingAssetRequest,
  LogoSettings,
  CompleteScreeningRequest,
  CompleteScreeningResponse,
  CreatePatientRequest,
  CreatePatientResponse,
  DashboardStats,
  DeliverScreeningResponse,
  DeliveryAvailabilityResponse,
  WhatsAppSessionResponse,
  ExportScreeningsMetadataResponse,
  ListCriticalCasesResponse,
  ListScreeningReportsResponse,
  ListUsersResponse,
  ListAuditLogsResponse,
  GenerateParticipantReportPdfRequest,
  GenerateParticipantReportPdfResponse,
  InitialSetupRequest,
  LoginRequest,
  LoginResponseData,
  SetupStatusResponse,
  CreateUserRequest,
  UpdateUserRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordWithTokenRequest,
  ResetUserPasswordRequest,
  UpdateUserProfileRequest,
  UserAdminResponse,
  UserProfileResponse,
  Patient,
  PreviousMeasurementsResponse,
  SaveMeasurementsRequest,
  SaveMeasurementsResponse,
  ScreeningDeliveryListResponse,
  ScreeningPdfMetadataResponse,
  ScreeningReportResponse,
  ScreeningSyncStatusResponse,
  SearchPatientsResponse,
  AiAvailabilityResponse,
  ScreeningAiSessionRecord,
  ScreeningExtractionResult,
  CreateScreeningAiSessionRequest,
  SyncTranscriptRequest,
  TranscribeAudioRequest,
  TranscribeAudioResponse,
  ParseScreeningVoiceRequest,
  ParseScreeningVoiceResponse,
  ExtractScreeningRequest,
  ReviewScreeningExtractionRequest,
} from '@medscreen/types';
import { getAuthToken } from './token-storage';

const API_BASE_URL =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL
    : '/api/v1';

export class ApiClientError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly errorCode: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

async function parseJsonBody(response: Response): Promise<ApiSuccessResponse<unknown> | ApiErrorResponse> {
  const text = await response.text();
  if (!text) {
    throw new ApiClientError(response.status, 'EMPTY_RESPONSE', 'Serverul nu a returnat un răspuns valid.');
  }

  try {
    return JSON.parse(text) as ApiSuccessResponse<unknown> | ApiErrorResponse;
  } catch {
    throw new ApiClientError(response.status, 'INVALID_RESPONSE', 'Serverul nu a returnat un răspuns valid.');
  }
}

async function request<T>(path: string, options: RequestInit = {}, attachAuth = true): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (attachAuth) {
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiClientError(0, 'NETWORK_ERROR', 'Nu s-a putut contacta serverul. Verificați conexiunea.');
  }

  const body = await parseJsonBody(response);

  if (!response.ok || body.status === 'error') {
    const errorBody = body as ApiErrorResponse;
    throw new ApiClientError(
      errorBody.code ?? response.status,
      errorBody.error?.code ?? 'UNKNOWN_ERROR',
      errorBody.error?.message ?? 'A apărut o eroare neașteptată.',
    );
  }

  return (body as ApiSuccessResponse<T>).data;
}

async function requestPublic<T>(path: string, options: RequestInit = {}): Promise<T> {
  return request<T>(path, options, false);
}

export const apiClient = {
  login(payload: LoginRequest) {
    return requestPublic<LoginResponseData>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getSetupStatus() {
    return requestPublic<SetupStatusResponse>('/setup/status');
  },

  createInitialAdmin(payload: InitialSetupRequest) {
    return requestPublic<LoginResponseData>('/setup/initial-admin', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getMe() {
    return request<{ user: LoginResponseData['user'] }>('/auth/me');
  },

  logout() {
    return request<{ success: true }>('/auth/logout', {
      method: 'POST',
    });
  },

  changePassword(payload: ChangePasswordRequest) {
    return request<LoginResponseData>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  forgotPassword(payload: ForgotPasswordRequest) {
    return requestPublic<ForgotPasswordResponse>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  resetPasswordWithToken(payload: ResetPasswordWithTokenRequest) {
    return requestPublic<{ success: true }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getMyProfile() {
    return request<UserProfileResponse>('/users/me/profile');
  },

  updateMyProfile(payload: UpdateUserProfileRequest) {
    return request<UserProfileResponse>('/users/me/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  listAuditLogs(params?: {
    search?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.action) query.set('action', params.action);
    if (params?.entityType) query.set('entity_type', params.entityType);
    if (params?.entityId) query.set('entity_id', params.entityId);
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request<ListAuditLogsResponse>(`/audit${suffix}`);
  },

  listCampaigns() {
    return request<{ campaigns: Campaign[] }>('/campaigns');
  },

  getCampaign(id: string) {
    return request<{ campaign: Campaign }>(`/campaigns/${id}`);
  },

  getCampaignDashboardSummary() {
    return request<CampaignDashboardSummary>('/campaigns/admin/dashboard');
  },

  listCampaignsAdmin(params?: {
    search?: string;
    status?: Campaign['status'];
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request<ListCampaignsAdminResponse>(`/campaigns/admin${suffix}`);
  },

  createCampaign(payload: CreateCampaignRequest) {
    return request<CampaignAdminResponse>('/campaigns', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateCampaign(id: string, payload: UpdateCampaignRequest) {
    return request<CampaignAdminResponse>(`/campaigns/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  activateCampaign(id: string) {
    return request<CampaignAdminResponse>(`/campaigns/${id}/activate`, {
      method: 'POST',
    });
  },

  closeCampaign(id: string) {
    return request<CampaignAdminResponse>(`/campaigns/${id}/close`, {
      method: 'POST',
    });
  },

  archiveCampaign(id: string) {
    return request<CampaignAdminResponse>(`/campaigns/${id}/archive`, {
      method: 'POST',
    });
  },

  deleteCampaign(id: string) {
    return request<{ success: true }>(`/campaigns/${id}`, {
      method: 'DELETE',
    });
  },

  getDashboardStats(campaignId: string) {
    const params = new URLSearchParams({ campaign_id: campaignId });
    return request<DashboardStats>(`/dashboard/stats?${params.toString()}`);
  },

  listCriticalCases(params: { campaignId: string; page?: number; limit?: number }) {
    const query = new URLSearchParams({ campaign_id: params.campaignId });
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    return request<ListCriticalCasesResponse>(`/dashboard/critical-cases?${query.toString()}`);
  },

  getExportScreeningsMetadata(campaignId: string) {
    const query = new URLSearchParams({ campaign_id: campaignId });
    return request<ExportScreeningsMetadataResponse>(`/export/screenings/metadata?${query.toString()}`);
  },

  async downloadScreeningsExport(
    campaignId: string,
    params?: { from?: string; to?: string; campaignDay?: number },
  ): Promise<{
    blob: Blob;
    filename: string;
    rowCount: number | null;
  }> {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const query = new URLSearchParams({ campaign_id: campaignId });
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    if (params?.campaignDay != null) query.set('campaign_day', String(params.campaignDay));
    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/export/screenings?${query.toString()}`, { headers });
    } catch {
      throw new ApiClientError(0, 'NETWORK_ERROR', 'Nu s-a putut contacta serverul. Verificați conexiunea.');
    }

    if (!response.ok) {
      const text = await response.text();
      try {
        const body = JSON.parse(text) as ApiErrorResponse;
        throw new ApiClientError(
          body.code ?? response.status,
          body.error?.code ?? 'EXPORT_FAILED',
          body.error?.message ?? 'Exportul nu a putut fi generat.',
        );
      } catch (error) {
        if (error instanceof ApiClientError) throw error;
        throw new ApiClientError(response.status, 'EXPORT_FAILED', 'Exportul nu a putut fi generat.');
      }
    }

    const disposition = response.headers.get('Content-Disposition');
    const filenameMatch = disposition?.match(/filename="([^"]+)"/);
    const filename = filenameMatch?.[1] ?? `medscreen-screeninguri-${new Date().toISOString().slice(0, 10)}.xlsx`;
    const rowCountHeader = response.headers.get('X-Export-Row-Count');
    const blob = await response.blob();

    return {
      blob,
      filename,
      rowCount: rowCountHeader ? Number(rowCountHeader) : null,
    };
  },

  searchPatients(params: { phone?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params.phone) query.set('phone', params.phone);
    if (params.search) query.set('search', params.search);
    return request<SearchPatientsResponse>(`/patients?${query.toString()}`);
  },

  createPatient(payload: CreatePatientRequest) {
    return request<CreatePatientResponse>('/patients', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getPatient(id: string) {
    return request<{ patient: Patient }>(`/patients/${id}`);
  },

  getPreviousMeasurements(patientId: string) {
    return request<PreviousMeasurementsResponse>(`/patients/${patientId}/previous-measurements`);
  },

  saveMeasurements(payload: SaveMeasurementsRequest) {
    return request<SaveMeasurementsResponse>('/screenings/measurements', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  evaluateClinicalEngine(payload: ClinicalEvaluationRequest) {
    return request<ClinicalEvaluationResponse>('/clinical/evaluate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  listClinicalRules(params?: {
    search?: string;
    category?: string;
    enabled?: boolean;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.category) query.set('category', params.category);
    if (params?.enabled !== undefined) query.set('enabled', String(params.enabled));
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request<ListClinicalRulesResponse>(`/clinical-rules${suffix}`);
  },

  getClinicalRule(ruleId: string) {
    return request<ClinicalRuleResponse>(`/clinical-rules/${ruleId}`);
  },

  createClinicalRule(payload: CreateClinicalRuleRequest) {
    return request<ClinicalRuleResponse>('/clinical-rules', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateClinicalRule(ruleId: string, payload: UpdateClinicalRuleRequest) {
    return request<ClinicalRuleResponse>(`/clinical-rules/${ruleId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  enableClinicalRule(ruleId: string) {
    return request<ClinicalRuleResponse>(`/clinical-rules/${ruleId}/enable`, {
      method: 'POST',
    });
  },

  disableClinicalRule(ruleId: string) {
    return request<ClinicalRuleResponse>(`/clinical-rules/${ruleId}/disable`, {
      method: 'POST',
    });
  },

  listClinicalRuleChanges(params?: { ruleId?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.ruleId) query.set('rule_id', params.ruleId);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request<ListClinicalRuleChangesResponse>(`/clinical-rules/history${suffix}`);
  },

  previewClinicalEvaluation(payload: ClinicalEvaluationRequest) {
    return request<PreviewClinicalEvaluationResponse>('/clinical-rules/preview', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getPublicClinicSettings() {
    return requestPublic<PublicClinicSettingsResponse>('/clinic-settings/public');
  },

  getClinicSettings() {
    return request<ClinicSettingsResponse>('/clinic-settings');
  },

  updateClinicSettingsSection(payload: UpdateClinicSettingsSectionRequest) {
    return request<ClinicSettingsResponse>('/clinic-settings', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  uploadClinicBrandingAsset(payload: UploadBrandingAssetRequest) {
    return request<{ logo: LogoSettings }>('/clinic-settings/branding/upload', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  completeScreening(screeningId: string, payload: CompleteScreeningRequest) {
    return request<CompleteScreeningResponse>(`/screenings/${screeningId}/complete`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  generateParticipantReportPdf(payload: GenerateParticipantReportPdfRequest) {
    return request<GenerateParticipantReportPdfResponse>('/reports/participant/pdf/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getScreeningSyncStatus(screeningId: string) {
    return request<ScreeningSyncStatusResponse>(`/sync/screenings/${screeningId}/status`);
  },

  getScreeningReport(screeningId: string) {
    return request<ScreeningReportResponse>(`/screenings/${screeningId}/report`);
  },

  getDeliveryAvailability(screeningId: string) {
    return request<DeliveryAvailabilityResponse>(`/screenings/${screeningId}/delivery/availability`);
  },

  listScreeningDeliveries(screeningId: string) {
    return request<ScreeningDeliveryListResponse>(`/screenings/${screeningId}/delivery`);
  },

  deliverScreeningEmail(screeningId: string, payload: { email: string }) {
    return request<DeliverScreeningResponse>(`/screenings/${screeningId}/delivery/email`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  deliverScreeningWhatsApp(screeningId: string, payload: { phone: string }) {
    return request<DeliverScreeningResponse>(`/screenings/${screeningId}/delivery/whatsapp`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getWhatsAppSession() {
    return request<WhatsAppSessionResponse>('/whatsapp/session');
  },

  connectWhatsAppSession() {
    return request<WhatsAppSessionResponse>('/whatsapp/session/connect', {
      method: 'POST',
    });
  },

  listScreeningReports(params: {
    campaignId: string;
    patientId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams({ campaign_id: params.campaignId });
    if (params.patientId) query.set('patient_id', params.patientId);
    if (params.search) query.set('search', params.search);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    return request<ListScreeningReportsResponse>(`/reports?${query.toString()}`);
  },

  getScreeningPdfMetadata(screeningId: string) {
    return request<ScreeningPdfMetadataResponse>(`/screenings/${screeningId}/report/pdf/metadata`);
  },

  async downloadScreeningPdf(screeningId: string): Promise<{ blob: Blob; filename: string }> {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/screenings/${screeningId}/report/pdf`, { headers });
    } catch {
      throw new ApiClientError(0, 'NETWORK_ERROR', 'Nu s-a putut contacta serverul. Verificați conexiunea.');
    }

    if (!response.ok) {
      throw new ApiClientError(
        response.status,
        'DOWNLOAD_FAILED',
        'PDF-ul nu a putut fi descărcat de pe server.',
      );
    }

    const disposition = response.headers.get('Content-Disposition');
    const filenameMatch = disposition?.match(/filename="([^"]+)"/);
    const filename = filenameMatch?.[1] ?? `raport-screening-${screeningId}.pdf`;
    const blob = await response.blob();

    return { blob, filename };
  },

  listUsers(params?: {
    search?: string;
    role?: string;
    active?: boolean;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.role) query.set('role', params.role);
    if (params?.active !== undefined) query.set('active', String(params.active));
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request<ListUsersResponse>(`/users${suffix}`);
  },

  getUser(userId: string) {
    return request<UserAdminResponse>(`/users/${userId}`);
  },

  createUser(payload: CreateUserRequest) {
    return request<UserAdminResponse>('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateUser(userId: string, payload: UpdateUserRequest) {
    return request<UserAdminResponse>(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  activateUser(userId: string) {
    return request<UserAdminResponse>(`/users/${userId}/activate`, {
      method: 'POST',
    });
  },

  deactivateUser(userId: string) {
    return request<UserAdminResponse>(`/users/${userId}/deactivate`, {
      method: 'POST',
    });
  },

  resetUserPassword(userId: string, payload: ResetUserPasswordRequest) {
    return request<{ success: true }>(`/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  unlockUser(userId: string) {
    return request<{ user: { id: string; locked_until: string | null; failed_login_attempts: number } }>(
      `/users/${userId}/unlock`,
      { method: 'POST' },
    );
  },

  deleteUser(userId: string) {
    return request<{ success: true }>(`/users/${userId}`, {
      method: 'DELETE',
    });
  },

  checkHealth() {
    const API_BASE = API_BASE_URL;
    return fetch(`${API_BASE}/health`, { method: 'GET', cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) {
          return { ok: false as const, uptime: undefined, checkedAt: new Date().toISOString() };
        }

        const body = (await response.json()) as ApiSuccessResponse<{ uptime?: number }>;
        return {
          ok: true as const,
          uptime: body.data?.uptime,
          checkedAt: new Date().toISOString(),
        };
      })
      .catch(() => ({
        ok: false as const,
        uptime: undefined,
        checkedAt: new Date().toISOString(),
      }));
  },

  getAiAvailability() {
    return request<AiAvailabilityResponse>('/ai/availability');
  },

  parseScreeningVoice(payload: ParseScreeningVoiceRequest) {
    return request<ParseScreeningVoiceResponse>('/ai/parse-screening-voice', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  createScreeningAiSession(payload: CreateScreeningAiSessionRequest) {
    return request<ScreeningAiSessionRecord>('/ai/sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getScreeningAiSession(sessionId: string) {
    return request<ScreeningAiSessionRecord>(`/ai/sessions/${sessionId}`);
  },

  syncTranscript(sessionId: string, payload: SyncTranscriptRequest) {
    return request<ScreeningAiSessionRecord>(`/ai/sessions/${sessionId}/transcript`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  transcribeAudio(sessionId: string, payload: TranscribeAudioRequest) {
    return request<TranscribeAudioResponse>(`/ai/sessions/${sessionId}/transcribe`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  extractScreening(sessionId: string, payload: ExtractScreeningRequest = {}) {
    return request<ScreeningExtractionResult>(`/ai/sessions/${sessionId}/extract`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  reviewScreeningExtraction(sessionId: string, payload: ReviewScreeningExtractionRequest) {
    return request<ScreeningAiSessionRecord>(`/ai/sessions/${sessionId}/review`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

export { clearAuthToken, getAuthToken, setAuthToken } from './token-storage';
