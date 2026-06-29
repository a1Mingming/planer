import type { Tag, CreateTagDto } from '../domain/tag/Tag';
import type { ITagRepository } from '../domain/tag/ITagRepository';
import {
  TagNotFoundError,
  TagAlreadyExistsError,
  TagPresetReadonlyError,
} from '../domain/tag/TagErrors';

export class TagService {
  constructor(private readonly tagRepo: ITagRepository) {}

  getTags(): Tag[] {
    return this.tagRepo.findAll();
  }

  createTag(dto: CreateTagDto): Tag {
    const existing = this.tagRepo.findByName(dto.name);
    if (existing) throw new TagAlreadyExistsError(dto.name);
    return this.tagRepo.create(dto);
  }

  deleteTag(id: number): void {
    const tag = this.tagRepo.findById(id);
    if (!tag) throw new TagNotFoundError(id);
    if (tag.is_preset) throw new TagPresetReadonlyError(tag.name);
    this.tagRepo.delete(id);
  }
}
