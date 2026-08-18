import { LoginUseCase } from '../application/auth/login.use-case';
import {
  ChangePasswordUseCase,
  ForgotPasswordUseCase,
  InvalidateSessionUseCase,
  ResetPasswordWithTokenUseCase,
} from '../application/auth/account.use-cases';
import {
  ActivateCampaignUseCase,
  ArchiveCampaignUseCase,
  CloseCampaignUseCase,
  CreateCampaignUseCase,
  DeleteCampaignUseCase,
  GetCampaignDashboardSummaryUseCase,
  GetCampaignUseCase,
  ListActiveCampaignsUseCase,
  ListCampaignsAdminUseCase,
  UpdateCampaignUseCase,
} from '../application/campaigns/campaign.use-cases';
import { GetDashboardStatsUseCase } from '../application/dashboard/get-dashboard-stats.use-case';
import { ListCriticalCasesUseCase } from '../application/dashboard/list-critical-cases.use-case';
import {
  GetPreviousMeasurementsUseCase,
  SaveMeasurementsUseCase,
} from '../application/measurements/measurements.use-cases';
import {
  CreatePatientUseCase,
  GetPatientUseCase,
  SearchPatientsUseCase,
} from '../application/patients/patient.use-cases';
import {
  GetUserProfileUseCase,
  UnlockUserAccountUseCase,
  UpdateUserProfileUseCase,
} from '../application/users/profile.use-cases';
import {
  CreateUserUseCase,
  DeleteUserUseCase,
  GetUserUseCase,
  ListUsersUseCase,
  ResetUserPasswordUseCase,
  SetUserActiveUseCase,
  UpdateUserUseCase,
} from '../application/users/user-admin.use-cases';
import {
  CreateInitialAdminUseCase,
  GetSetupStatusUseCase,
} from '../application/setup/setup.use-cases';
import {
  ListAuditLogsUseCase,
  RecordAuditEventUseCase,
} from '../application/audit/audit.use-cases';
import { GetScreeningSyncStatusUseCase } from '../application/sync/sync.use-cases';
import {
  ExportScreeningsExcelUseCase,
  GetExportScreeningsMetadataUseCase,
} from '../application/export/export-screenings.use-cases';
import { GenerateScreeningReportPdfUseCase } from '../application/reports/generate-screening-report-pdf.use-case';
import { ListScreeningReportsUseCase } from '../application/reports/list-screening-reports.use-case';
import { htmlReportPdfService } from './pdf/html-report-pdf.service';
import {
  DeliverScreeningEmailUseCase,
  DeliverScreeningWhatsAppUseCase,
  GetDeliveryAvailabilityUseCase,
  ListScreeningDeliveriesUseCase,
} from '../application/delivery/screening-delivery.use-cases';
import { EvaluateClinicalEngineUseCase } from '../application/clinical/evaluate-clinical-engine.use-case';
import {
  CreateClinicalRuleUseCase,
  GetClinicalRuleUseCase,
  ListClinicalRuleChangesUseCase,
  ListClinicalRulesUseCase,
  LoadActiveClinicalEngineConfigUseCase,
  PreviewClinicalEvaluationUseCase,
  SetClinicalRuleEnabledUseCase,
  UpdateClinicalRuleUseCase,
} from '../application/clinical-rules/clinical-rules.use-cases';
import {
  GetClinicSettingsUseCase,
  GetPublicClinicSettingsUseCase,
  UpdateClinicSettingsSectionUseCase,
} from '../application/clinic-settings/clinic-settings.use-cases';
import { UploadClinicBrandingAssetUseCase } from '../application/clinic-settings/upload-clinic-branding-asset.use-case';
import {
  CreateScreeningAiSessionUseCase,
  ExtractScreeningUseCase,
  GetAiAvailabilityUseCase,
  GetScreeningAiSessionUseCase,
  ParseScreeningVoiceUseCase,
  ReviewScreeningExtractionUseCase,
  SyncTranscriptUseCase,
  TranscribeAudioUseCase,
} from '../application/ai-screening/ai-screening.use-cases';
import {
  CompleteScreeningUseCase,
  GetScreeningPdfUseCase,
  GetScreeningReportUseCase,
} from '../application/screenings/screening-completion.use-cases';
import { PrismaCampaignRepository } from './database/repositories/prisma-campaign.repository';
import { PrismaPatientRepository } from './database/repositories/prisma-patient.repository';
import { PrismaScreeningRepository } from './database/repositories/prisma-screening.repository';
import { PrismaScreeningDeliveryRepository } from './database/repositories/prisma-screening-delivery.repository';
import { screeningPdfStorageService } from './storage/screening-pdf-storage.service';
import { SmtpEmailDeliveryService } from './delivery/smtp-email-delivery.service';
import { WhatsAppDeliveryService } from './delivery/whatsapp-delivery.service';
import { PrismaUserRepository } from './database/repositories/prisma-user.repository';
import { PrismaPasswordResetTokenRepository } from './database/repositories/prisma-password-reset-token.repository';
import { PrismaAuditLogRepository } from './database/repositories/prisma-audit.repository';
import { PrismaClinicalRuleRepository } from './database/repositories/prisma-clinical-rule.repository';
import { PrismaClinicSettingsRepository } from './database/repositories/prisma-clinic-settings.repository';
import { PrismaScreeningAiSessionRepository } from './database/repositories/prisma-screening-ai-session.repository';
import { ClinicSettingsResolver } from './clinic-settings/clinic-settings.resolver';
import { clinicBrandingStorageService } from './storage/clinic-branding-storage.service';
import { AuditRecorder } from './audit/audit-recorder';
import { LoginAuditAdapter } from './audit/login-audit.adapter';

const userRepository = new PrismaUserRepository();
const passwordResetTokenRepository = new PrismaPasswordResetTokenRepository();
const auditLogRepository = new PrismaAuditLogRepository();
const clinicalRuleRepository = new PrismaClinicalRuleRepository();
const clinicSettingsRepository = new PrismaClinicSettingsRepository();
const clinicSettingsResolver = new ClinicSettingsResolver(clinicSettingsRepository);
const smtpEmailDeliveryService = new SmtpEmailDeliveryService(clinicSettingsResolver);
const whatsAppDeliveryService = new WhatsAppDeliveryService();
const campaignRepository = new PrismaCampaignRepository();
const patientRepository = new PrismaPatientRepository();
const screeningRepository = new PrismaScreeningRepository();
const screeningDeliveryRepository = new PrismaScreeningDeliveryRepository();
const screeningAiSessionRepository = new PrismaScreeningAiSessionRepository();

export const recordAuditEventUseCase = new RecordAuditEventUseCase(auditLogRepository);
export const listAuditLogsUseCase = new ListAuditLogsUseCase(auditLogRepository);
export const auditRecorder = new AuditRecorder(recordAuditEventUseCase);
export const loginAuditAdapter = new LoginAuditAdapter(auditRecorder);
export const loginUseCase = new LoginUseCase(userRepository, loginAuditAdapter);
export const changePasswordUseCase = new ChangePasswordUseCase(userRepository);
export const forgotPasswordUseCase = new ForgotPasswordUseCase(
  userRepository,
  passwordResetTokenRepository,
  smtpEmailDeliveryService,
);
export const resetPasswordWithTokenUseCase = new ResetPasswordWithTokenUseCase(
  userRepository,
  passwordResetTokenRepository,
);
export const invalidateSessionUseCase = new InvalidateSessionUseCase(userRepository);
export const getUserProfileUseCase = new GetUserProfileUseCase(userRepository);
export const updateUserProfileUseCase = new UpdateUserProfileUseCase(userRepository);
export const unlockUserAccountUseCase = new UnlockUserAccountUseCase(userRepository);
export const getSetupStatusUseCase = new GetSetupStatusUseCase(userRepository);
export const createInitialAdminUseCase = new CreateInitialAdminUseCase(userRepository);
export const listUsersUseCase = new ListUsersUseCase(userRepository);
export const getUserUseCase = new GetUserUseCase(userRepository);
export const createUserUseCase = new CreateUserUseCase(userRepository);
export const updateUserUseCase = new UpdateUserUseCase(userRepository);
export const setUserActiveUseCase = new SetUserActiveUseCase(userRepository);
export const resetUserPasswordUseCase = new ResetUserPasswordUseCase(userRepository);
export const deleteUserUseCase = new DeleteUserUseCase(userRepository);
export const listClinicalRulesUseCase = new ListClinicalRulesUseCase(clinicalRuleRepository);
export const getClinicalRuleUseCase = new GetClinicalRuleUseCase(clinicalRuleRepository);
export const createClinicalRuleUseCase = new CreateClinicalRuleUseCase(clinicalRuleRepository);
export const updateClinicalRuleUseCase = new UpdateClinicalRuleUseCase(clinicalRuleRepository);
export const setClinicalRuleEnabledUseCase = new SetClinicalRuleEnabledUseCase(clinicalRuleRepository);
export const listClinicalRuleChangesUseCase = new ListClinicalRuleChangesUseCase(clinicalRuleRepository);
export const previewClinicalEvaluationUseCase = new PreviewClinicalEvaluationUseCase(clinicalRuleRepository);
export const loadActiveClinicalEngineConfigUseCase = new LoadActiveClinicalEngineConfigUseCase(
  clinicalRuleRepository,
);
export const getPublicClinicSettingsUseCase = new GetPublicClinicSettingsUseCase(
  clinicSettingsRepository,
  clinicSettingsResolver,
);
export const getClinicSettingsUseCase = new GetClinicSettingsUseCase(
  clinicSettingsRepository,
  clinicSettingsResolver,
);
export const updateClinicSettingsSectionUseCase = new UpdateClinicSettingsSectionUseCase(
  clinicSettingsRepository,
  clinicSettingsResolver,
);
export const uploadClinicBrandingAssetUseCase = new UploadClinicBrandingAssetUseCase(
  clinicSettingsRepository,
  clinicSettingsResolver,
  clinicBrandingStorageService,
);
export const clinicSettingsResolverInstance = clinicSettingsResolver;
export const getScreeningSyncStatusUseCase = new GetScreeningSyncStatusUseCase(screeningRepository);
export const getAiAvailabilityUseCase = new GetAiAvailabilityUseCase(clinicSettingsResolver);
export const createScreeningAiSessionUseCase = new CreateScreeningAiSessionUseCase(
  screeningAiSessionRepository,
);
export const getScreeningAiSessionUseCase = new GetScreeningAiSessionUseCase(
  screeningAiSessionRepository,
);
export const syncTranscriptUseCase = new SyncTranscriptUseCase(screeningAiSessionRepository);
export const transcribeAudioUseCase = new TranscribeAudioUseCase(
  screeningAiSessionRepository,
  clinicSettingsResolver,
);
export const extractScreeningUseCase = new ExtractScreeningUseCase(
  screeningAiSessionRepository,
  clinicSettingsResolver,
);
export const parseScreeningVoiceUseCase = new ParseScreeningVoiceUseCase(clinicSettingsResolver);
export const reviewScreeningExtractionUseCase = new ReviewScreeningExtractionUseCase(
  screeningAiSessionRepository,
);
export const listActiveCampaignsUseCase = new ListActiveCampaignsUseCase(campaignRepository);
export const getCampaignUseCase = new GetCampaignUseCase(campaignRepository);
export const getCampaignDashboardSummaryUseCase = new GetCampaignDashboardSummaryUseCase(
  campaignRepository,
);
export const listCampaignsAdminUseCase = new ListCampaignsAdminUseCase(campaignRepository);
export const createCampaignUseCase = new CreateCampaignUseCase(campaignRepository);
export const updateCampaignUseCase = new UpdateCampaignUseCase(campaignRepository);
export const activateCampaignUseCase = new ActivateCampaignUseCase(campaignRepository);
export const closeCampaignUseCase = new CloseCampaignUseCase(campaignRepository);
export const archiveCampaignUseCase = new ArchiveCampaignUseCase(campaignRepository);
export const deleteCampaignUseCase = new DeleteCampaignUseCase(campaignRepository);
export const getDashboardStatsUseCase = new GetDashboardStatsUseCase(
  campaignRepository,
  screeningRepository,
);
export const listCriticalCasesUseCase = new ListCriticalCasesUseCase(screeningRepository);
export const searchPatientsUseCase = new SearchPatientsUseCase(patientRepository);
export const createPatientUseCase = new CreatePatientUseCase(patientRepository);
export const getPatientUseCase = new GetPatientUseCase(patientRepository);
export const getPreviousMeasurementsUseCase = new GetPreviousMeasurementsUseCase(screeningRepository);
export const saveMeasurementsUseCase = new SaveMeasurementsUseCase(
  screeningRepository,
  screeningAiSessionRepository,
  patientRepository,
);
export const evaluateClinicalEngineUseCase = new EvaluateClinicalEngineUseCase(
  loadActiveClinicalEngineConfigUseCase,
);
export const completeScreeningUseCase = new CompleteScreeningUseCase(
  screeningRepository,
  screeningPdfStorageService,
);
export const getScreeningReportUseCase = new GetScreeningReportUseCase(screeningRepository);
export const getScreeningPdfUseCase = new GetScreeningPdfUseCase(
  screeningRepository,
  screeningPdfStorageService,
);
export const listScreeningReportsUseCase = new ListScreeningReportsUseCase(screeningRepository);
export const generateScreeningReportPdfUseCase = new GenerateScreeningReportPdfUseCase(
  htmlReportPdfService,
);
export const getExportScreeningsMetadataUseCase = new GetExportScreeningsMetadataUseCase(
  screeningRepository,
);
export const exportScreeningsExcelUseCase = new ExportScreeningsExcelUseCase(
  screeningRepository,
  campaignRepository,
);
export const getDeliveryAvailabilityUseCase = new GetDeliveryAvailabilityUseCase(
  screeningRepository,
  clinicSettingsResolver,
);
export const listScreeningDeliveriesUseCase = new ListScreeningDeliveriesUseCase(
  screeningDeliveryRepository,
);
export const deliverScreeningEmailUseCase = new DeliverScreeningEmailUseCase(
  screeningRepository,
  patientRepository,
  screeningDeliveryRepository,
  screeningPdfStorageService,
  smtpEmailDeliveryService,
  clinicSettingsResolver,
);
export const deliverScreeningWhatsAppUseCase = new DeliverScreeningWhatsAppUseCase(
  screeningRepository,
  patientRepository,
  screeningDeliveryRepository,
  screeningPdfStorageService,
  whatsAppDeliveryService,
  clinicSettingsResolver,
);
export {
  userRepository,
  passwordResetTokenRepository,
  auditLogRepository,
  clinicalRuleRepository,
  clinicSettingsRepository,
  clinicSettingsResolver,
  campaignRepository,
  patientRepository,
  screeningRepository,
  screeningDeliveryRepository,
  screeningAiSessionRepository,
};
