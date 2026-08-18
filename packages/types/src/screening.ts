import type { ClinicalEvaluationResult, ScreeningAnamnesis } from './clinical';

export interface CompleteScreeningSignaturePayload {
  image_base64: string;
  mime_type: 'image/png';
  signed_at: string;
  participant_name: string;
}

export interface CompleteScreeningPdfPayload {
  filename: string;
  mime_type: 'application/pdf';
  base64: string;
  generated_at: string;
  byte_length: number;
  generator_version: number;
}

export interface GenerateParticipantReportPdfRequest {
  participant_report: Record<string, unknown>;
  participant_signature_data_url?: string | null;
}

export interface GenerateParticipantReportPdfResponse extends CompleteScreeningPdfPayload {
  screening_id: string;
}

export interface CompleteScreeningRequest {
  anamnesis: ScreeningAnamnesis;
  clinical_evaluation: ClinicalEvaluationResult;
  participant_report: Record<string, unknown>;
  signature: CompleteScreeningSignaturePayload;
  pdf: CompleteScreeningPdfPayload;
}

export interface CompleteScreeningResponse {
  screening_id: string;
  status: 'completed';
  completed_at: string;
  pdf_filename: string;
  pdf_storage_path: string;
  already_completed: boolean;
}

export interface ScreeningReportResponse {
  screening_id: string;
  participant_report: Record<string, unknown>;
  completed_at: string;
}

export interface ScreeningPdfMetadataResponse {
  screening_id: string;
  filename: string;
  mime_type: 'application/pdf';
  byte_length: number;
  generator_version: number;
  generated_at: string;
  storage_path: string;
}

export interface ScreeningReportListItem {
  screening_id: string;
  patient_id: string | null;
  patient_name: string | null;
  patient_phone: string | null;
  operator_id: string;
  operator_name: string;
  completed_at: string;
  pdf_filename: string | null;
  has_pdf: boolean;
}

export interface ListScreeningReportsResponse {
  reports: ScreeningReportListItem[];
  total: number;
  page: number;
  limit: number;
}
