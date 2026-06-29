import { http } from './request';
import type { Tag } from '@/types/plan';

export function getTags(): Promise<Tag[]> {
  return http.get('/api/tags');
}

export function createTag(name: string): Promise<Tag> {
  return http.post('/api/tags', { name });
}

export function deleteTag(id: number): Promise<void> {
  return http.del(`/api/tags/${id}`);
}
