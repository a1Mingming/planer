import { Router } from 'express';
import type { PlanController } from '../controllers/PlanController';

export function createPlanRouter(controller: PlanController): Router {
  const router = Router();
  router.get('/',                              controller.getPlans);
  router.get('/:id',                           controller.getPlan);
  router.post('/',                             controller.createPlan);
  router.put('/:id',                           controller.updatePlan);
  // 具体子路径必须在 /:id/recurrence 之前注册
  router.get('/:id/recurrence/count',          controller.getRecurrenceCount);
  router.patch('/:id/recurrence/rebuild',      controller.rebuildPlanRecurrence);
  router.put('/:id/recurrence',                controller.updatePlanRecurrence);
  router.delete('/:id',                        controller.deletePlan);
  router.delete('/:id/recurrence',             controller.deletePlanRecurrence);
  return router;
}
