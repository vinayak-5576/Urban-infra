export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'citizen' | 'officer' | 'zone_head' | 'dept_head' | 'admin';
  department_id?: string;
  zone_id?: string;
}

export interface Zone {
  id: string;
  name: string;
  corporation: string;
  ward_number?: number;
  is_demo: boolean;
  description?: string;
  geom_geojson: {
    type: string;
    coordinates: any;
  };
}

export interface Category {
  id: string;
  code: string;
  name: string;
  icon: string;
  severity_weight: number;
  default_radius_m: number;
  default_dedupe_window_days: number;
  sla_ack_hours: number;
  sla_resolve_hours: number;
}

export interface PriorityBreakdown {
  severity: number;
  exposure: number;
  corroboration: number;
  recurrence: number;
  age_vs_sla: number;
  total_score: number;
  weights: {
    severity: number;
    exposure: number;
    corroboration: number;
    recurrence: number;
    age_vs_sla: number;
  };
}

export interface Attachment {
  id: string;
  storage_path: string;
  filename: string;
  mime_type: string;
  file_size: number;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  issue_id?: string;
  description: string;
  category_user_id: string;
  category_pred_id?: string;
  pred_confidence?: number;
  latitude: number;
  longitude: number;
  zone_id: string;
  status: string;
  is_synthetic: boolean;
  created_at: string;
  attachments: Attachment[];
}

export interface Issue {
  id: string;
  category_id: string;
  latitude: number;
  longitude: number;
  zone_id: string;
  department_id: string;
  status: 'new' | 'acknowledged' | 'in_progress' | 'resolved_pending_verification' | 'closed_verified' | 'closed_unverified' | 'reopened' | 'rejected';
  severity_score: number;
  priority_score: number;
  priority_breakdown: PriorityBreakdown;
  ack_due_at?: string;
  resolve_due_at?: string;
  first_reported_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
  verified_at?: string;
  closed_at?: string;
  reopen_count: number;
  report_count: number;
  is_synthetic: boolean;
  reports?: Report[];
}

export interface AnalyticsSummary {
  total_reports: number;
  total_issues: number;
  open_issues: number;
  resolved_verified: number;
  reopen_rate_percent: number;
  category_breakdown: Array<{ name: string; icon: string; count: number }>;
  zone_breakdown: Array<{ zone: string; count: number }>;
}

export interface ZonePerformance {
  zone_id: string;
  zone_name: string;
  corporation: string;
  ward_label?: string;
  n: number;
  insufficient_data: boolean;
  minimum_sample_threshold?: number;
  total_reports: number;
  dedupe_corroboration_ratio: number;
  open_backlog: number;
  median_ack_hours?: number | null;
  median_resolve_hours?: number | null;
  sla_compliance_pct: number;
  sla_wilson_interval_95: [number, number];
  reopened_count: number;
  reopen_rate_pct: number;
  reopen_wilson_interval_95?: [number, number];
  is_demo: boolean;
  rank?: number;
  performance_score?: number;
  zone_head_name?: string;
}

export interface DemoPersona {
  id: string;
  email: string;
  full_name: string;
  role: 'citizen' | 'officer' | 'zone_head' | 'admin';
  zone_id?: string;
  zone_name: string;
  corporation: string;
  department_id?: string;
}
