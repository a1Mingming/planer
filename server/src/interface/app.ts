import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler } from './middlewares/errorHandler';
import { createPlanRouter } from './routes/plans';
import { createTagRouter } from './routes/tags';
import { PlanController } from './controllers/PlanController';
import { TagController } from './controllers/TagController';
import { PlanService } from '../application/PlanService';
import { TagService } from '../application/TagService';
import { SqlitePlanRepository } from '../infrastructure/repositories/SqlitePlanRepository';
import { SqliteTagRepository } from '../infrastructure/repositories/SqliteTagRepository';

export function createApp(): express.Application {
  const app = express();

  // 中间件
  app.use(cors());
  app.use(express.json());
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // 依赖注入
  const planRepo = new SqlitePlanRepository();
  const tagRepo  = new SqliteTagRepository();
  const planService = new PlanService(planRepo);
  const tagService  = new TagService(tagRepo);
  const planController = new PlanController(planService);
  const tagController  = new TagController(tagService);

  // 路由
  app.use('/api/plans', createPlanRouter(planController));
  app.use('/api/tags',  createTagRouter(tagController));

  // 统一错误处理（必须在路由之后）
  app.use(errorHandler);

  return app;
}
