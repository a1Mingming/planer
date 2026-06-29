import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { PlanNotFoundError } from '../../domain/plan/PlanErrors';
import {
  TagNotFoundError,
  TagAlreadyExistsError,
  TagPresetReadonlyError,
} from '../../domain/tag/TagErrors';
import { fail } from '../response';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json(fail('INVALID_PARAM', err.errors.map((e) => e.message).join('; ')));
    return;
  }

  if (
    err instanceof PlanNotFoundError ||
    err instanceof TagNotFoundError
  ) {
    res.status(404).json(fail((err as { code: string }).code, err.message));
    return;
  }

  if (err instanceof TagAlreadyExistsError) {
    res.status(409).json(fail(err.code, err.message));
    return;
  }

  if (err instanceof TagPresetReadonlyError) {
    res.status(403).json(fail(err.code, err.message));
    return;
  }

  console.error('[UnhandledError]', err);
  res.status(500).json(fail('INTERNAL_ERROR', '服务器内部错误，请稍后重试'));
}
