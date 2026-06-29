import type { Plan, CreatePlanDto, UpdatePlanDto } from '../domain/plan/Plan';
import type { IPlanRepository } from '../domain/plan/IPlanRepository';
import { PlanNotFoundError } from '../domain/plan/PlanErrors';

export class PlanService {
  constructor(private readonly planRepo: IPlanRepository) {}

  getPlans(view: 'year' | 'month' | 'day', date: string): Plan[] | { month: string; total: number; done: number }[] {
    if (view === 'year') {
      return this.planRepo.getYearSummary(date);
    }
    return this.planRepo.findByView(view, date);
  }

  getPlan(id: number): Plan {
    const plan = this.planRepo.findById(id);
    if (!plan) throw new PlanNotFoundError(id);
    return plan;
  }

  createPlan(dto: CreatePlanDto): Plan {
    return this.planRepo.create(dto);
  }

  updatePlan(id: number, dto: UpdatePlanDto): Plan {
    const plan = this.planRepo.update(id, dto);
    if (!plan) throw new PlanNotFoundError(id);
    return plan;
  }

  deletePlan(id: number): void {
    const deleted = this.planRepo.delete(id);
    if (!deleted) throw new PlanNotFoundError(id);
  }
}
