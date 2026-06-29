export type ViewMode = 'year' | 'month' | 'day';

export interface Plan {
  id: number;
  title: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  tags: string[];
  done: boolean;
  created_at: string;
  updated_at: string;
}

export type CreatePlanPayload = Omit<Plan, 'id' | 'created_at' | 'updated_at'>;
export type UpdatePlanPayload = Partial<CreatePlanPayload>;

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
