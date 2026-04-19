export interface ApiMetadata {
  error?: string;
  message?: string;
  status_code: number;
  timestamp: string;
}

export interface ApiResponse<TData = unknown> {
  data: TData;
  metadata: ApiMetadata;
}

export class ApiError extends Error {
  readonly statusCode: number;
  readonly backendError?: string;
  readonly backendMessage?: string;
  readonly response?: unknown;

  constructor(params: {
    message: string;
    statusCode: number;
    backendError?: string;
    backendMessage?: string;
    response?: unknown;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.statusCode = params.statusCode;
    this.backendError = params.backendError;
    this.backendMessage = params.backendMessage;
    this.response = params.response;
  }
}

