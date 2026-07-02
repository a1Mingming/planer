export type ViewMode = 'year' | 'month' | 'day';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';
export type RecurrenceScope = 'one' | 'future' | 'all';

export interface Plan {
  id: number;
  title: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  tags: string[];
  done: boolean;
  priority: 1 | 2 | 3;
  recurrence_type: RecurrenceType;
  recurrence_days: number[] | null;
  recurrence_end_date: string | null;
  recurrence_group_id: string | null;
  created_at: string;
  updated_at: string;
}

export type CreatePlanPayload = Omit<Plan, 'id' | 'created_at' | 'updated_at'>;
export type UpdatePlanPayload = Partial<Omit<CreatePlanPayload, 'recurrence_type' | 'recurrence_days' | 'recurrence_end_date' | 'recurrence_group_id'>>;

export interface RecurrenceUpdatePayload {
  scope: RecurrenceScope;
  title?: string;
  start_time?: string | null;
  end_time?: string | null;
  tags?: string[];
  priority?: 1 | 2 | 3;
}

export interface RecurrenceRebuildPayload {
  scope: 'future' | 'all';
  title?: string;
  start_time?: string | null;
  end_time?: string | null;
  tags?: string[];
  priority?: 1 | 2 | 3;
  recurrence_type: RecurrenceType;
  recurrence_days?: number[] | null;
  recurrence_end_date?: string | null;
  date: string;
}

export interface YearSummary {
  month: string;
  total: number;
  done: number;
}

export interface Tag {
  id: number;
  name: string;
  is_preset: boolean;
}

export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: { code: string; message: string };
}

/** 判断计划是否可编辑：日期未来，或今天且时间段未到来 */
export function isPlanEditable(plan: Plan): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (plan.date < today) return false;
  if (plan.date > today) return true;
  // 今天：全天计划（无 start_time）算今天0点已到来
  if (!plan.start_time) return false;
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const [h, m] = plan.start_time.split(':').map(Number);
  return h * 60 + m > nowMin;
}

