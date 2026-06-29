import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TagService } from '../../../../application/TagService';
import type { ITagRepository } from '../../../../domain/tag/ITagRepository';
import type { Tag } from '../../../../domain/tag/Tag';
import {
  TagNotFoundError,
  TagAlreadyExistsError,
  TagPresetReadonlyError,
} from '../../../../domain/tag/TagErrors';

const presetTag: Tag = { id: 1, name: '工作', is_preset: true };
const customTag: Tag = { id: 6, name: '阅读', is_preset: false };

function makeMockRepo(overrides: Partial<ITagRepository> = {}): ITagRepository {
  return {
    findAll: vi.fn().mockReturnValue([presetTag, customTag]),
    findById: vi.fn().mockReturnValue(null),
    findByName: vi.fn().mockReturnValue(null),
    create: vi.fn().mockReturnValue(customTag),
    delete: vi.fn().mockReturnValue(true),
    ...overrides,
  };
}

describe('TagService', () => {
  let repo: ITagRepository;
  let service: TagService;

  beforeEach(() => {
    repo = makeMockRepo();
    service = new TagService(repo);
  });

  describe('getTags', () => {
    it('returns all tags from repo', () => {
      const result = service.getTags();
      expect(repo.findAll).toHaveBeenCalledOnce();
      expect(result).toEqual([presetTag, customTag]);
    });
  });

  describe('createTag', () => {
    it('throws TagAlreadyExistsError when name already exists', () => {
      (repo.findByName as ReturnType<typeof vi.fn>).mockReturnValue(presetTag);
      expect(() => service.createTag({ name: '工作' })).toThrow(TagAlreadyExistsError);
      expect(() => service.createTag({ name: '工作' })).toThrow('工作');
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('creates tag when name does not exist', () => {
      (repo.findByName as ReturnType<typeof vi.fn>).mockReturnValue(null);
      const result = service.createTag({ name: '阅读' });
      expect(repo.findByName).toHaveBeenCalledWith('阅读');
      expect(repo.create).toHaveBeenCalledWith({ name: '阅读' });
      expect(result).toEqual(customTag);
    });
  });

  describe('deleteTag', () => {
    it('throws TagNotFoundError when tag does not exist', () => {
      (repo.findById as ReturnType<typeof vi.fn>).mockReturnValue(null);
      expect(() => service.deleteTag(99)).toThrow(TagNotFoundError);
      expect(repo.delete).not.toHaveBeenCalled();
    });

    it('throws TagPresetReadonlyError when tag is preset', () => {
      (repo.findById as ReturnType<typeof vi.fn>).mockReturnValue(presetTag);
      expect(() => service.deleteTag(1)).toThrow(TagPresetReadonlyError);
      expect(() => service.deleteTag(1)).toThrow('工作');
      expect(repo.delete).not.toHaveBeenCalled();
    });

    it('deletes custom tag successfully', () => {
      (repo.findById as ReturnType<typeof vi.fn>).mockReturnValue(customTag);
      expect(() => service.deleteTag(6)).not.toThrow();
      expect(repo.delete).toHaveBeenCalledWith(6);
    });
  });
});
