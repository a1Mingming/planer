import { http } from './request';
import type { Plan, CreatePlanPayload, UpdatePlanPayload, YearSummary } from '@/types/plan';

export function getYearPlans(year: string): Promise<YearSummary[]> {
  return http.get('/api/plans', { view: 'year', date: year });
}

export function getMonthPlans(month: string): Promise<Plan[]> {
  return http.get('/api/plans', { view: 'month', date: month });
}

export function getDayPlans(date: string): Promise<Plan[]> {
  return http.get('/api/plans', { view: 'day', date });
}

export function createPlan(payload: CreatePlanPayload): Promise<Plan> {
  return http.post('/api/plans', payload);
}

export function updatePlan(id: number, payload: UpdatePlanPayload): Promise<Plan> {
  return http.put(`/api/plans/${id}`, payload);
}

export function deletePlan(id: number): Promise<void> {
  return http.del(`/api/plans/${id}`);
}
