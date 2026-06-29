import { Router } from 'express';
import type { TagController } from '../controllers/TagController';

export function createTagRouter(controller: TagController): Router {
  const router = Router();
  router.get('/',        controller.getTags);
  router.post('/',       controller.createTag);
  router.delete('/:id',  controller.deleteTag);
  return router;
}
