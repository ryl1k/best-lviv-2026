export const apiEndpoints = {
  auth: {
    login: '/v1/auth/login',
    signup: '/v1/auth/signup',
    me: '/v1/auth/me',
  },
  audits: {
    upload: '/v1/audits/upload',
    uploadJson: '/v1/audits/upload/json',
  },
  subscriptions: {
    list: '/v1/subscriptions',
    mine: '/v1/subscriptions/me',
    purchase: (id: number) => `/v1/subscriptions/${id}/purchase`,
  },
  tasks: {
    byId: (taskId: string) => `/v1/tasks/${taskId}`,
    discrepancyById: (taskId: string, discrepancyId: number) => `/v1/tasks/${taskId}/discrepancies/${discrepancyId}`,
    exportCsv: (taskId: string) => `/v1/tasks/${taskId}/export`,
    persons: (taskId: string) => `/v1/tasks/${taskId}/persons`,
    results: (taskId: string) => `/v1/tasks/${taskId}/results`,
    summary: (taskId: string) => `/v1/tasks/${taskId}/results/summary`,
  },
} as const;

