import { Router } from 'express';
import type { PlanController } from '../controllers/PlanController';

export function createPlanRouter(controller: PlanController): Router {
  const router = Router();
  router.get('/',     controller.getPlans);
  router.get('/:id',  controller.getPlan);
  router.post('/',    controller.createPlan);
  router.put('/:id',  controller.updatePlan);
  router.delete('/:id', controller.deletePlan);
  return router;
}
