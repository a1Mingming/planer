import type { Plan, CreatePlanDto, UpdatePlanDto, RecurrenceScope } from './Plan';

export interface IPlanRepository {
  findByView(view: 'year' | 'month' | 'day', date: string): Plan[];
  findById(id: number): Plan | null;
  search(q: string): Plan[];
  create(dto: CreatePlanDto): Plan;
  createBatch(dtos: CreatePlanDto[]): Plan[];
  update(id: number, dto: UpdatePlanDto): Plan | null;
  updateByGroup(groupId: string, scope: RecurrenceScope, fromDate: string, dto: UpdatePlanDto): void;
  delete(id: number): boolean;
  deleteByGroup(groupId: string, scope: RecurrenceScope, fromDate: string, today: string): void;
  countByGroup(groupId: string, scope: RecurrenceScope, fromDate: string, today: string): number;
  getYearSummary(year: string): { month: string; total: number; done: number }[];
}
