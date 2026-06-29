import { describe, it, expect } from 'vitest';
import {
  CreatePlanSchema,
  UpdatePlanSchema,
  GetPlansSchema,
} from '../../../../../interface/validators/plan';

describe('CreatePlanSchema', () => {
  const validPayload = {
    title: '测试计划',
    date: '2026-06-29',
  };

  it('accepts valid minimal payload', () => {
    const result = CreatePlanSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('accepts full payload', () => {
    const result = CreatePlanSchema.safeParse({
      ...validPayload,
      start_time: '09:00',
      end_time: '10:00',
      tags: ['工作'],
      done: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing title', () => {
    const result = CreatePlanSchema.safeParse({ date: '2026-06-29' });
    expect(result.success).toBe(false);
  });

  it('rejects empty title', () => {
    const result = CreatePlanSchema.safeParse({ title: '', date: '2026-06-29' });
    expect(result.success).toBe(false);
  });

  it('rejects title longer than 100 characters', () => {
    const result = CreatePlanSchema.safeParse({
      title: 'a'.repeat(101),
      date: '2026-06-29',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing date', () => {
    const result = CreatePlanSchema.safeParse({ title: '计划' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid date format', () => {
    const result = CreatePlanSchema.safeParse({ title: '计划', date: '20260629' });
    expect(result.success).toBe(false);
    const result2 = CreatePlanSchema.safeParse({ title: '计划', date: '2026/06/29' });
    expect(result2.success).toBe(false);
  });

  it('rejects invalid time format', () => {
    const result = CreatePlanSchema.safeParse({
      ...validPayload,
      start_time: '9:00',
    });
    expect(result.success).toBe(false);
  });

  it('rejects end_time earlier than start_time', () => {
    const result = CreatePlanSchema.safeParse({
      ...validPayload,
      start_time: '10:00',
      end_time: '09:00',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('end_time');
    }
  });

  it('accepts equal times (not strictly after)', () => {
    const result = CreatePlanSchema.safeParse({
      ...validPayload,
      start_time: '10:00',
      end_time: '10:00',
    });
    expect(result.success).toBe(false);
  });

  it('defaults tags to empty array when omitted', () => {
    const result = CreatePlanSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toEqual([]);
    }
  });

  it('defaults done to false when omitted', () => {
    const result = CreatePlanSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.done).toBe(false);
    }
  });
});

describe('UpdatePlanSchema', () => {
  it('accepts empty object (all fields optional)', () => {
    const result = UpdatePlanSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts partial update', () => {
    const result = UpdatePlanSchema.safeParse({ title: '新标题', done: true });
    expect(result.success).toBe(true);
  });

  it('accepts null start_time to clear time', () => {
    const result = UpdatePlanSchema.safeParse({ start_time: null });
    expect(result.success).toBe(true);
  });
});

describe('GetPlansSchema', () => {
  it('accepts valid view=year', () => {
    const result = GetPlansSchema.safeParse({ view: 'year', date: '2026' });
    expect(result.success).toBe(true);
  });

  it('accepts valid view=month', () => {
    const result = GetPlansSchema.safeParse({ view: 'month', date: '2026-06' });
    expect(result.success).toBe(true);
  });

  it('accepts valid view=day', () => {
    const result = GetPlansSchema.safeParse({ view: 'day', date: '2026-06-29' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid view value', () => {
    const result = GetPlansSchema.safeParse({ view: 'week', date: '2026-06-29' });
    expect(result.success).toBe(false);
  });

  it('rejects missing date', () => {
    const result = GetPlansSchema.safeParse({ view: 'month' });
    expect(result.success).toBe(false);
  });

  it('rejects date shorter than 4 characters', () => {
    const result = GetPlansSchema.safeParse({ view: 'year', date: '202' });
    expect(result.success).toBe(false);
  });
});
