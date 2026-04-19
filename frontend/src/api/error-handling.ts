import i18n from '@/i18n';
import { ApiError } from '@/api/contracts';

export type ApiErrorCategory =
  | 'authentication'
  | 'permission'
  | 'validation'
  | 'not_found'
  | 'state'
  | 'configuration'
  | 'generic';

export type ApiErrorContext =
  | 'generic'
  | 'login'
  | 'register'
  | 'upload'
  | 'pricingLoad'
  | 'subscriptionPurchase'
  | 'taskLoad'
  | 'taskSummary'
  | 'taskResults'
  | 'taskExport'
  | 'discrepancyLoad'
  | 'discrepancyExplanation'
  | 'discrepancyStatusUpdate';

interface ApiErrorMessageOptions {
  context?: ApiErrorContext;
  fallbackKey?: string;
}

export interface ApiErrorDetails {
  message: string;
  backendCode?: string;
  rawMessage?: string;
  category: ApiErrorCategory;
  statusCode?: number;
}

const BACKEND_ERROR_KEY_BY_CODE: Record<string, string> = {
  'bad request': 'errors.backend.badRequest',
  'missing auth header': 'errors.backend.missingAuthHeader',
  'invalid username or password': 'errors.backend.invalidCredentials',
  'invalid token': 'errors.backend.invalidToken',
  'user not found': 'errors.backend.userNotFound',
  'invalid pagination params': 'errors.backend.invalidPaginationParams',
  'not found': 'errors.backend.notFound',
  'no suppliers available for rebalancing': 'errors.backend.noSuppliersAvailable',
  'alert or proposal already resolved': 'errors.backend.alreadyResolved',
  forbidden: 'errors.backend.forbidden',
  'invalid status transition': 'errors.backend.invalidStatusTransition',
  'insufficient stock to fully satisfy request': 'errors.backend.insufficientStock',
  'task not found': 'errors.backend.taskNotFound',
  'discrepancy not found': 'errors.backend.discrepancyNotFound',
  'invalid resolution status': 'errors.backend.invalidResolutionStatus',
  'unsupported file format, use xlsx or csv': 'errors.backend.unsupportedFileFormat',
  'subscription not found': 'errors.backend.subscriptionNotFound',
  'user already has an active subscription this month': 'errors.backend.alreadySubscribed',
  'subscription tier is insufficient for this operation': 'errors.backend.insufficientTier',
  'no tries remaining for this operation': 'errors.backend.noTriesRemaining',
  'no active subscription': 'errors.backend.noActiveSubscription',
  'feature not configured': 'errors.backend.notConfigured',
};

const BACKEND_ERROR_CATEGORY_BY_CODE: Record<string, ApiErrorCategory> = {
  'bad request': 'validation',
  'missing auth header': 'authentication',
  'invalid username or password': 'authentication',
  'invalid token': 'authentication',
  'user not found': 'not_found',
  'invalid pagination params': 'validation',
  'not found': 'not_found',
  'no suppliers available for rebalancing': 'configuration',
  'alert or proposal already resolved': 'state',
  forbidden: 'permission',
  'invalid status transition': 'state',
  'insufficient stock to fully satisfy request': 'validation',
  'task not found': 'not_found',
  'discrepancy not found': 'not_found',
  'invalid resolution status': 'validation',
  'unsupported file format, use xlsx or csv': 'validation',
  'subscription not found': 'not_found',
  'user already has an active subscription this month': 'permission',
  'subscription tier is insufficient for this operation': 'permission',
  'no tries remaining for this operation': 'permission',
  'no active subscription': 'permission',
  'feature not configured': 'configuration',
};

const STATUS_CODE_KEY_BY_CODE: Partial<Record<number, string>> = {
  400: 'errors.backend.badRequest',
  401: 'errors.backend.invalidToken',
  403: 'errors.backend.forbidden',
  404: 'errors.backend.notFound',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeBackendCode(value: string): string {
  return value.trim().toLowerCase();
}

function collectStringCandidates(value: unknown, results: string[]): void {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      results.push(trimmed);
    }
    return;
  }

  if (!isRecord(value)) return;

  const directKeys = ['error', 'message', 'detail', 'title'];
  for (const key of directKeys) {
    const candidate = value[key];
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      results.push(candidate.trim());
    }
  }

  if (isRecord(value.metadata)) {
    collectStringCandidates(value.metadata, results);
  }
  if (isRecord(value.data)) {
    collectStringCandidates(value.data, results);
  }
}

function getErrorCandidates(error: unknown): string[] {
  const candidates: string[] = [];

  if (error instanceof ApiError) {
    if (error.backendError) candidates.push(error.backendError);
    if (error.backendMessage) candidates.push(error.backendMessage);
    collectStringCandidates(error.response, candidates);
    if (error.message) candidates.push(error.message);
  } else if (error instanceof Error) {
    candidates.push(error.message);
  } else {
    collectStringCandidates(error, candidates);
  }

  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = candidate.trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function resolveBackendCode(error: unknown): { backendCode?: string; rawMessage?: string } {
  const candidates = getErrorCandidates(error);

  for (const candidate of candidates) {
    const normalized = normalizeBackendCode(candidate);
    if (normalized in BACKEND_ERROR_KEY_BY_CODE) {
      return { backendCode: normalized, rawMessage: candidate };
    }
  }

  const rawMessage = candidates.find((candidate) => !/^request failed with status \d+$/i.test(candidate));
  return { rawMessage };
}

function resolveFallbackMessage(context: ApiErrorContext, fallbackKey?: string): string {
  if (fallbackKey) {
    const translated = i18n.t(fallbackKey);
    if (translated !== fallbackKey) return translated;
  }

  const contextKey = `errors.context.${context}`;
  const contextMessage = i18n.t(contextKey);
  if (contextMessage !== contextKey) return contextMessage;

  return i18n.t('errors.generic.unknown');
}

export function getApiErrorDetails(
  error: unknown,
  options: ApiErrorMessageOptions = {},
): ApiErrorDetails {
  const context = options.context ?? 'generic';
  const { backendCode, rawMessage } = resolveBackendCode(error);
  const statusCode = error instanceof ApiError ? error.statusCode : undefined;

  const messageKey =
    (backendCode ? BACKEND_ERROR_KEY_BY_CODE[backendCode] : undefined) ??
    (statusCode ? STATUS_CODE_KEY_BY_CODE[statusCode] : undefined);

  const message = messageKey ? i18n.t(messageKey) : resolveFallbackMessage(context, options.fallbackKey);
  const category =
    (backendCode ? BACKEND_ERROR_CATEGORY_BY_CODE[backendCode] : undefined) ??
    (statusCode === 401
      ? 'authentication'
      : statusCode === 403
        ? 'permission'
        : statusCode === 404
          ? 'not_found'
          : statusCode === 400
            ? 'validation'
            : 'generic');

  if (!messageKey && rawMessage && typeof console !== 'undefined') {
    console.warn('[api-error] Unmapped backend error:', rawMessage);
  }

  return {
    message,
    backendCode,
    rawMessage,
    category,
    statusCode,
  };
}

export function getApiErrorMessage(
  error: unknown,
  fallbackOrOptions?: string | ApiErrorMessageOptions,
): string {
  if (typeof fallbackOrOptions === 'string') {
    const details = getApiErrorDetails(error);
    return details.backendCode ? details.message : fallbackOrOptions;
  }

  return getApiErrorDetails(error, fallbackOrOptions).message;
}
