export interface CriticalCaseWarning {
  code: string;
  message: string;
  severity: 'critical';
}

export interface CriticalCaseListItem {
  screening_id: string;
  patient_id: string | null;
  patient_name: string | null;
  patient_phone: string | null;
  operator_id: string;
  operator_name: string;
  completed_at: string;
  critical_warnings: CriticalCaseWarning[];
  has_pdf: boolean;
}

export interface ListCriticalCasesResponse {
  cases: CriticalCaseListItem[];
  total: number;
  page: number;
  limit: number;
}
