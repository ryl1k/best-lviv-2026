export interface User {
  id: number;
  email: string;
  username: string;
  created_at?: string;
  updated_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
}

export interface Subscription {
  id: number;
  name: string;
  tier: 'ONESHOT' | 'BASIC' | 'PRO';
  price_uah: number;
  max_csv_tries: number;
  max_satellite_tries: number;
  created_at?: string;
  updated_at?: string;
}

export interface UserSubscription {
  id: number;
  user_id: number;
  subscription_id: number;
  starts_at: string;
  expires_at: string;
  csv_tries_used: number;
  satellite_tries_used: number;
  subscription: Subscription;
  created_at?: string;
}

export interface UploadTaskResponse {
  task_id: string;
}

export interface TaskStatsResponse {
  total_land: number;
  total_estate: number;
  matched: number;
  discrepancies_count: number;
}

export interface TaskResponse {
  id: string;
  status: string;
  created_at?: string;
  completed_at?: string;
  error_message?: string;
  stats?: TaskStatsResponse;
}

export interface DiscrepancyResponse {
  id: number;
  task_id: string;
  tax_id: string;
  owner_name: string;
  rule_code: string;
  severity: string;
  risk_score: number;
  resolution_status: string;
  description: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<TItem> {
  items: TItem[];
  page: number;
  page_size: number;
  total: number;
}

export interface PersonRiskResponse {
  tax_id: string;
  owner_name: string;
  total_risk_score: number;
  discrepancy_count: number;
  max_severity: string;
  rule_codes: string[];
}

export interface SummaryResponse {
  total_count: number;
  by_rule: Record<string, number>;
  by_severity: Record<string, number>;
}

export interface EstateRecord {
  tax_id?: string;
  owner_name?: string;
  object_type?: string;
  address?: string;
  area_m2?: number;
  share?: number;
  co_ownership?: string;
  registered_at?: string;
  terminated_at?: string;
  raw?: Record<string, string>;
}

export interface LandRecord {
  cadastral_num: string;
  tax_id?: string;
  owner_name?: string;
  purpose_code?: string;
  purpose_text?: string;
  land_use_type?: string;
  ownership_form?: string;
  location?: string;
  koatuu?: string;
  area_ha?: number;
  normative_value?: number;
  share?: number;
  registered_at?: string;
  raw?: Record<string, string>;
}

