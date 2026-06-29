import { z } from 'zod';

export const CreatePlanSchema = z.object({
  title:      z.string().min(1, '标题不能为空').max(100, '标题最多 100 字符'),
  date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式应为 YYYY-MM-DD'),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, '时间格式应为 HH:MM').optional(),
  end_time:   z.string().regex(/^\d{2}:\d{2}$/, '时间格式应为 HH:MM').optional(),
  tags:       z.array(z.string().max(20)).optional().default([]),
  done:       z.boolean().optional().default(false),
}).refine(
  (data) => {
    if (data.start_time && data.end_time) {
      return data.end_time > data.start_time;
    }
    return true;
  },
  { message: '结束时间必须晚于开始时间', path: ['end_time'] }
);

export const UpdatePlanSchema = z.object({
  title:      z.string().min(1).max(100).optional(),
  date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  end_time:   z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  tags:       z.array(z.string().max(20)).optional(),
  done:       z.boolean().optional(),
});

export const GetPlansSchema = z.object({
  view: z.enum(['year', 'month', 'day']),
  date: z.string().min(4),
});
