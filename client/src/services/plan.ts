import { http } from './request';
import type { Plan, CreatePlanPayload, UpdatePlanPayload, RecurrenceUpdatePayload, RecurrenceRebuildPayload, RecurrenceScope, YearSummary } from '@/types/plan';

export function getYearPlans(year: string): Promise<YearSummary[]> {
  return http.get('/api/plans', { view: 'year', date: year });
}

export function getMonthPlans(month: string): Promise<Plan[]> {
  return http.get('/api/plans', { view: 'month', date: month });
}

export function getDayPlans(date: string): Promise<Plan[]> {
  return http.get('/api/plans', { view: 'day', date });
}

export function searchPlans(q: string): Promise<Plan[]> {
  return http.get('/api/plans', { view: 'search', q });
}

export function createPlan(payload: CreatePlanPayload): Promise<Plan> {
  return http.post('/api/plans', payload);
}

export function updatePlan(id: number, payload: UpdatePlanPayload): Promise<Plan> {
  return http.put(`/api/plans/${id}`, payload);
}

export function updatePlanRecurrence(id: number, payload: RecurrenceUpdatePayload): Promise<Plan> {
  return http.put(`/api/plans/${id}/recurrence`, payload);
}

export function getPlanRecurrenceCount(id: number, scope: 'future' | 'all'): Promise<{ count: number }> {
  return http.get(`/api/plans/${id}/recurrence/count`, { scope });
}

export function rebuildPlanRecurrence(id: number, payload: RecurrenceRebuildPayload): Promise<Plan> {
  return http.patch(`/api/plans/${id}/recurrence/rebuild`, payload);
}

export function deletePlan(id: number): Promise<void> {
  return http.del(`/api/plans/${id}`);
}

export function deletePlanRecurrence(id: number, scope: RecurrenceScope): Promise<void> {
  return http.del(`/api/plans/${id}/recurrence`, { scope });
}
