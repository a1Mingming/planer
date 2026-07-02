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

export type CreatePlanDto = Omit<Plan, 'id' | 'created_at' | 'updated_at'>;
export type UpdatePlanDto = Partial<Omit<CreatePlanDto, 'recurrence_type' | 'recurrence_days' | 'recurrence_end_date' | 'recurrence_group_id'>>;
