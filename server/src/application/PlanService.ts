import type { Plan, CreatePlanDto, UpdatePlanDto, RecurrenceScope, RecurrenceType } from '../domain/plan/Plan';
import type { IPlanRepository } from '../domain/plan/IPlanRepository';
import { PlanNotFoundError } from '../domain/plan/PlanErrors';

export interface RebuildPlanDto {
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

function generateRecurrenceDates(dto: CreatePlanDto): string[] {
  const { recurrence_type, recurrence_days, recurrence_end_date, date } = dto;
  if (recurrence_type === 'none') return [date];

  const start = new Date(date);
  const endDate = recurrence_end_date
    ? new Date(recurrence_end_date)
    : new Date(start.getTime() + 90 * 24 * 60 * 60 * 1000); // 默认 90 天

  // 最多 365 天保护
  const maxDate = new Date(start.getTime() + 365 * 24 * 60 * 60 * 1000);
  const end = endDate < maxDate ? endDate : maxDate;

  const dates: string[] = [];
  const cur = new Date(start);

  while (cur <= end) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    if (recurrence_type === 'daily') {
      dates.push(dateStr);
      cur.setDate(cur.getDate() + 1);
    } else if (recurrence_type === 'weekly') {
      const dow = cur.getDay(); // 0=周日,1=周一...6=周六
      if (!recurrence_days || recurrence_days.length === 0 || recurrence_days.includes(dow)) {
        dates.push(dateStr);
      }
      cur.setDate(cur.getDate() + 1);
    } else if (recurrence_type === 'monthly') {
      dates.push(dateStr);
      cur.setMonth(cur.getMonth() + 1);
    }
  }

  return dates;
}

export class PlanService {
  constructor(private readonly planRepo: IPlanRepository) {}

  getPlans(view: 'year' | 'month' | 'day' | 'search', date?: string, q?: string): Plan[] | { month: string; total: number; done: number }[] {
    if (view === 'year' && date) {
      return this.planRepo.getYearSummary(date);
    }
    if (view === 'search') {
      return this.planRepo.search(q ?? '');
    }
    return this.planRepo.findByView(view as 'month' | 'day', date!);
  }

  getPlan(id: number): Plan {
    const plan = this.planRepo.findById(id);
    if (!plan) throw new PlanNotFoundError(id);
    return plan;
  }

  createPlan(dto: CreatePlanDto): Plan | Plan[] {
    if (dto.recurrence_type === 'none') {
      return this.planRepo.create(dto);
    }

    const groupId = crypto.randomUUID();
    const dates = generateRecurrenceDates(dto);
    const dtos: CreatePlanDto[] = dates.map((d) => ({
      ...dto,
      date: d,
      done: false,
      recurrence_group_id: groupId,
    }));

    const plans = this.planRepo.createBatch(dtos);
    // 返回第一条（与创建日期对应的那条）
    return plans[0];
  }

  updatePlan(id: number, dto: UpdatePlanDto): Plan {
    const plan = this.planRepo.update(id, dto);
    if (!plan) throw new PlanNotFoundError(id);
    return plan;
  }

  updatePlanRecurrence(id: number, scope: RecurrenceScope, dto: UpdatePlanDto): Plan {
    const plan = this.planRepo.findById(id);
    if (!plan) throw new PlanNotFoundError(id);

    if (scope === 'one' || !plan.recurrence_group_id) {
      return this.updatePlan(id, dto);
    }

    this.planRepo.updateByGroup(plan.recurrence_group_id, scope, plan.date, dto);
    return this.planRepo.findById(id)!;
  }

  deletePlan(id: number): void {
    const deleted = this.planRepo.delete(id);
    if (!deleted) throw new PlanNotFoundError(id);
  }

  deletePlanRecurrence(id: number, scope: RecurrenceScope): void {
    const plan = this.planRepo.findById(id);
    if (!plan) throw new PlanNotFoundError(id);

    if (scope === 'one' || !plan.recurrence_group_id) {
      return this.deletePlan(id);
    }

    const today = new Date().toISOString().slice(0, 10);
    this.planRepo.deleteByGroup(plan.recurrence_group_id, scope, plan.date, today);
  }

  getRecurrenceCount(id: number, scope: 'future' | 'all'): number {
    const plan = this.planRepo.findById(id);
    if (!plan || !plan.recurrence_group_id) return 0;
    const today = new Date().toISOString().slice(0, 10);
    return this.planRepo.countByGroup(plan.recurrence_group_id, scope, plan.date, today);
  }

  rebuildPlanRecurrence(id: number, dto: RebuildPlanDto): Plan {
    const plan = this.planRepo.findById(id);
    if (!plan) throw new PlanNotFoundError(id);
    if (!plan.recurrence_group_id) throw new PlanNotFoundError(id);

    const today = new Date().toISOString().slice(0, 10);
    this.planRepo.deleteByGroup(plan.recurrence_group_id, dto.scope, dto.date, today);

    const dates = generateRecurrenceDates({
      ...plan,
      date: dto.date,
      recurrence_type: dto.recurrence_type,
      recurrence_days: dto.recurrence_days ?? null,
      recurrence_end_date: dto.recurrence_end_date ?? null,
    } as CreatePlanDto);

    const dtos: CreatePlanDto[] = dates.map((d) => ({
      title: dto.title ?? plan.title,
      date: d,
      start_time: dto.start_time !== undefined ? dto.start_time : plan.start_time,
      end_time: dto.end_time !== undefined ? dto.end_time : plan.end_time,
      tags: dto.tags ?? plan.tags,
      done: false,
      priority: dto.priority ?? plan.priority,
      recurrence_type: dto.recurrence_type,
      recurrence_days: dto.recurrence_days ?? null,
      recurrence_end_date: dto.recurrence_end_date ?? null,
      recurrence_group_id: plan.recurrence_group_id,
    }));

    const plans = this.planRepo.createBatch(dtos);
    return plans[0];
  }
}
