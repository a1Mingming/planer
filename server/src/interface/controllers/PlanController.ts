import type { Request, Response, NextFunction } from 'express';
import type { PlanService } from '../../application/PlanService';
import { CreatePlanSchema, UpdatePlanSchema, GetPlansSchema, RecurrenceUpdateSchema, RecurrenceDeleteSchema, RecurrenceRebuildSchema, RecurrenceCountSchema } from '../validators/plan';
import { ok } from '../response';

export class PlanController {
  constructor(private readonly planService: PlanService) {}

  getPlans = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const query = GetPlansSchema.parse(req.query);
      const data = this.planService.getPlans(query.view, query.date, query.q);
      res.json(ok(data));
    } catch (err) {
      next(err);
    }
  };

  getPlan = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const plan = this.planService.getPlan(Number(req.params.id));
      res.json(ok(plan));
    } catch (err) {
      next(err);
    }
  };

  createPlan = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const dto = CreatePlanSchema.parse(req.body);
      const result = this.planService.createPlan({
        ...dto,
        tags: dto.tags ?? [],
        done: dto.done ?? false,
        start_time: dto.start_time ?? null,
        end_time: dto.end_time ?? null,
        priority: dto.priority ?? 1,
        recurrence_type: dto.recurrence_type ?? 'none',
        recurrence_days: dto.recurrence_days ?? null,
        recurrence_end_date: dto.recurrence_end_date ?? null,
        recurrence_group_id: null,
      });
      // createPlan returns the first instance (or single plan)
      const plan = Array.isArray(result) ? result[0] : result;
      res.status(201).json(ok(plan));
    } catch (err) {
      next(err);
    }
  };

  updatePlan = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const dto = UpdatePlanSchema.parse(req.body);
      const plan = this.planService.updatePlan(Number(req.params.id), dto);
      res.json(ok(plan));
    } catch (err) {
      next(err);
    }
  };

  updatePlanRecurrence = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { scope, ...dto } = RecurrenceUpdateSchema.parse(req.body);
      const plan = this.planService.updatePlanRecurrence(Number(req.params.id), scope, dto);
      res.json(ok(plan));
    } catch (err) {
      next(err);
    }
  };

  deletePlan = (req: Request, res: Response, next: NextFunction): void => {
    try {
      this.planService.deletePlan(Number(req.params.id));
      res.json(ok({ id: Number(req.params.id) }));
    } catch (err) {
      next(err);
    }
  };

  deletePlanRecurrence = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { scope } = RecurrenceDeleteSchema.parse(req.body);
      this.planService.deletePlanRecurrence(Number(req.params.id), scope);
      res.json(ok({ id: Number(req.params.id), scope }));
    } catch (err) {
      next(err);
    }
  };

  getRecurrenceCount = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { scope } = RecurrenceCountSchema.parse(req.query);
      const count = this.planService.getRecurrenceCount(Number(req.params.id), scope);
      res.json(ok({ count }));
    } catch (err) {
      next(err);
    }
  };

  rebuildPlanRecurrence = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const dto = RecurrenceRebuildSchema.parse(req.body);
      const plan = this.planService.rebuildPlanRecurrence(Number(req.params.id), dto);
      res.json(ok(plan));
    } catch (err) {
      next(err);
    }
  };
}
