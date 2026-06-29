import type { Request, Response, NextFunction } from 'express';
import type { PlanService } from '../../application/PlanService';
import { CreatePlanSchema, UpdatePlanSchema, GetPlansSchema } from '../validators/plan';
import { ok } from '../response';

export class PlanController {
  constructor(private readonly planService: PlanService) {}

  getPlans = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const query = GetPlansSchema.parse(req.query);
      const data = this.planService.getPlans(query.view, query.date);
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
      const plan = this.planService.createPlan({
        ...dto,
        tags: dto.tags ?? [],
        done: dto.done ?? false,
        start_time: dto.start_time ?? null,
        end_time: dto.end_time ?? null,
      });
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

  deletePlan = (req: Request, res: Response, next: NextFunction): void => {
    try {
      this.planService.deletePlan(Number(req.params.id));
      res.json(ok({ id: Number(req.params.id) }));
    } catch (err) {
      next(err);
    }
  };
}
