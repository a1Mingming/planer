// Plan 实体类
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

export type CreatePlanDto = Omit<Plan, 'id' | 'created_at' | 'updated_at'>;
export type UpdatePlanDto = Partial<CreatePlanDto>;
