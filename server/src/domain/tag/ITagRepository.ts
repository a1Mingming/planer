import type { Tag, CreateTagDto } from './Tag';

export interface ITagRepository {
  findAll(): Tag[];
  findById(id: number): Tag | null;
  findByName(name: string): Tag | null;
  create(dto: CreateTagDto): Tag;
  delete(id: number): boolean;
}
