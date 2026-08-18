import { useQuery } from '@tanstack/react-query';
import type { AuditAction, AuditEntityType } from '@medscreen/types';
import { apiClient } from '../../../shared/lib/api-client';

export interface ListAuditLogsParams {
  search?: string;
  action?: AuditAction;
  entityType?: AuditEntityType;
  entityId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export function useAuditLogs(params: ListAuditLogsParams) {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => apiClient.listAuditLogs(params),
  });
}
