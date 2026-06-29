import type { Plan, CreatePlanDto, UpdatePlanDto } from './Plan';

export interface IPlanRepository {
  findByView(view: 'year' | 'month' | 'day', date: string): Plan[];
  findById(id: number): Plan | null;
  create(dto: CreatePlanDto): Plan;
  update(id: number, dto: UpdatePlanDto): Plan | null;
  delete(id: number): boolean;
  getYearSummary(year: string): { month: string; total: number; done: number }[];
}
