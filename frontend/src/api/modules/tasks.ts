import { apiEndpoints } from '@/api/endpoints';
import { httpClient } from '@/api/http-client';
import { getAccessToken } from '@/api/token-storage';
import { env } from '@/config/env';
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

function buildCsvFilename(taskId: string, response: Response): string {
  const contentDisposition = response.headers.get('content-disposition') ?? '';
  const match = contentDisposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i);
  const encoded = match?.[1] ?? match?.[2];
  if (!encoded) {
    return `task-${taskId}-discrepancies.csv`;
  }

  try {
    return decodeURIComponent(encoded);
  } catch {
    return encoded;
  }
}

export const tasksApi = {
  listTasks() {
    return httpClient.get<TaskResponse[]>(apiEndpoints.tasks.list, { auth: true });
  },

  getTask(taskId: string) {
    return httpClient.get<TaskResponse>(apiEndpoints.tasks.byId(taskId), { auth: true });
  },

  getDiscrepancy(taskId: string, discrepancyId: number) {
    return httpClient.get<DiscrepancyResponse>(apiEndpoints.tasks.discrepancyById(taskId, discrepancyId), {
      auth: true,
    });
  },

  updateDiscrepancyResolution(taskId: string, discrepancyId: number, resolutionStatus: string) {
    return httpClient.patch<null>(
      apiEndpoints.tasks.discrepancyById(taskId, discrepancyId),
      { resolution_status: resolutionStatus },
      { auth: true },
    );
  },

  getPersons(taskId: string, page = 1, pageSize = 50) {
    return httpClient.get<PaginatedResponse<PersonRiskResponse>>(apiEndpoints.tasks.persons(taskId), {
      auth: true,
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

  getDiscrepancyExplanation(taskId: string, discrepancyId: number) {
    return httpClient.get<{ explanation?: string }>(
      apiEndpoints.tasks.discrepancyExplain(taskId, discrepancyId),
      { auth: true },
    );
  },

  async exportTaskCsv(taskId: string): Promise<{ blob: Blob; filename: string }> {
    const headers = new Headers();
    headers.set('Accept', 'text/csv');

    const token = getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${env.apiBaseUrl}${apiEndpoints.tasks.exportCsv(taskId)}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`CSV export failed with status ${response.status}`);
    }

    return {
      blob: await response.blob(),
      filename: buildCsvFilename(taskId, response),
    };
  },
};
