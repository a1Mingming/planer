import { describe, it, expect } from 'vitest';
import { CreateTagSchema } from '../../../../../interface/validators/tag';

describe('CreateTagSchema', () => {
  it('accepts valid tag name', () => {
    const result = CreateTagSchema.safeParse({ name: '阅读' });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = CreateTagSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing name field', () => {
    const result = CreateTagSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects name longer than 20 characters', () => {
    const result = CreateTagSchema.safeParse({ name: 'a'.repeat(21) });
    expect(result.success).toBe(false);
  });

  it('accepts name exactly 20 characters', () => {
    const result = CreateTagSchema.safeParse({ name: 'a'.repeat(20) });
    expect(result.success).toBe(true);
  });

  it('accepts name exactly 1 character', () => {
    const result = CreateTagSchema.safeParse({ name: 'x' });
    expect(result.success).toBe(true);
  });
});
