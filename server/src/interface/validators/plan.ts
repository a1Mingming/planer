import { z } from 'zod';

const recurrenceType = z.enum(['none', 'daily', 'weekly', 'monthly']).default('none');

export const CreatePlanSchema = z.object({
  title:               z.string().min(1, '标题不能为空').max(100, '标题最多 100 字符'),
  date:                z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式应为 YYYY-MM-DD'),
  start_time:          z.string().regex(/^\d{2}:\d{2}$/, '时间格式应为 HH:MM'),
  end_time:            z.string().regex(/^\d{2}:\d{2}$/, '时间格式应为 HH:MM'),
  tags:                z.array(z.string().max(20)).optional().default([]),
  done:                z.boolean().optional().default(false),
  priority:            z.union([z.literal(1), z.literal(2), z.literal(3)]).optional().default(1),
  recurrence_type:     recurrenceType,
  recurrence_days:     z.array(z.number().int().min(0).max(6)).optional().nullable(),
  recurrence_end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
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
  priority:   z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
});

export const RecurrenceUpdateSchema = z.object({
  scope:      z.enum(['one', 'future', 'all']),
  title:      z.string().min(1).max(100).optional(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  end_time:   z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  tags:       z.array(z.string().max(20)).optional(),
  priority:   z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
});

export const RecurrenceDeleteSchema = z.object({
  scope: z.enum(['one', 'future', 'all']),
});

export const RecurrenceRebuildSchema = z.object({
  scope:                z.enum(['future', 'all']),
  title:                z.string().min(1).max(100).optional(),
  start_time:           z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  end_time:             z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  tags:                 z.array(z.string().max(20)).optional(),
  priority:             z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  recurrence_type:      z.enum(['daily', 'weekly', 'monthly']),
  recurrence_days:      z.array(z.number().int().min(0).max(6)).optional().nullable(),
  recurrence_end_date:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  date:                 z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const RecurrenceCountSchema = z.object({
  scope: z.enum(['future', 'all']),
});

export const GetPlansSchema = z.object({
  view: z.enum(['year', 'month', 'day', 'search']),
  date: z.string().min(4),
  q:    z.string().optional(),
});
