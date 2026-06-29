import type { Request, Response, NextFunction } from 'express';
import type { TagService } from '../../application/TagService';
import { CreateTagSchema } from '../validators/tag';
import { ok } from '../response';

export class TagController {
  constructor(private readonly tagService: TagService) {}

  getTags = (req: Request, res: Response, next: NextFunction): void => {
    try {
      res.json(ok(this.tagService.getTags()));
    } catch (err) {
      next(err);
    }
  };

  createTag = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const dto = CreateTagSchema.parse(req.body);
      const tag = this.tagService.createTag(dto);
      res.status(201).json(ok(tag));
    } catch (err) {
      next(err);
    }
  };

  deleteTag = (req: Request, res: Response, next: NextFunction): void => {
    try {
      this.tagService.deleteTag(Number(req.params.id));
      res.json(ok({ id: Number(req.params.id) }));
    } catch (err) {
      next(err);
    }
  };
}
