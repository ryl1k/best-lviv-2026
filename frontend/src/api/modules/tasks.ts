import { apiEndpoints } from '@/api/endpoints';
import { httpClient } from '@/api/http-client';
import type {
  DiscrepancyResponse,
  PaginatedResponse,
  PersonRiskResponse,
  SummaryResponse,
  TaskResponse,
} from '@/api/models';

export interface TaskResultsFilters {
  severity?: string;
  rule_code?: string;
  resolution_status?: string;
  tax_id?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export const tasksApi = {
  getTask(taskId: string) {
    return httpClient.get<TaskResponse>(apiEndpoints.tasks.byId(taskId), { auth: true });
  },

  getDiscrepancy(taskId: string, discrepancyId: number) {
    return httpClient.get<DiscrepancyResponse>(apiEndpoints.tasks.discrepancyById(taskId, discrepancyId));
  },

  updateDiscrepancyResolution(taskId: string, discrepancyId: number, resolutionStatus: string) {
    return httpClient.patch<null>(
      apiEndpoints.tasks.discrepancyById(taskId, discrepancyId),
      { resolution_status: resolutionStatus },
    );
  },

  getPersons(taskId: string, page = 1, pageSize = 50) {
    return httpClient.get<PaginatedResponse<PersonRiskResponse>>(apiEndpoints.tasks.persons(taskId), {
      query: { page, page_size: pageSize },
    });
  },

  getResults(taskId: string, filters: TaskResultsFilters = {}) {
    return httpClient.get<PaginatedResponse<DiscrepancyResponse>>(apiEndpoints.tasks.results(taskId), {
      auth: true,
      query: {
        severity: filters.severity,
        rule_code: filters.rule_code,
        resolution_status: filters.resolution_status,
        tax_id: filters.tax_id,
        search: filters.search,
        page: filters.page,
        page_size: filters.page_size,
      },
    });
  },

  getSummary(taskId: string) {
    return httpClient.get<SummaryResponse>(apiEndpoints.tasks.summary(taskId), { auth: true });
  },
};
