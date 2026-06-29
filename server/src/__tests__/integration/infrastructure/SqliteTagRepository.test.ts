import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';

vi.mock('../../../infrastructure/db/connection', () => ({
  getDb: vi.fn(),
}));

import { getDb } from '../../../infrastructure/db/connection';
import { SqliteTagRepository } from '../../../infrastructure/repositories/SqliteTagRepository';

let db: Database.Database;

function runMigrate(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      name      TEXT    NOT NULL UNIQUE,
      is_preset INTEGER NOT NULL DEFAULT 0
    );
  `);
}

describe('SqliteTagRepository (integration)', () => {
  let repo: SqliteTagRepository;

  beforeEach(() => {
    db = new Database(':memory:');
    runMigrate(db);
    vi.mocked(getDb).mockReturnValue(db);
    repo = new SqliteTagRepository();
  });

  afterEach(() => {
    db.close();
    vi.mocked(getDb).mockReset();
  });

  describe('create and findAll', () => {
    it('creates a tag and retrieves it', () => {
      const tag = repo.create({ name: '阅读' });
      expect(tag.id).toBeGreaterThan(0);
      expect(tag.name).toBe('阅读');
      expect(tag.is_preset).toBe(false);
    });

    it('findAll returns all tags ordered by is_preset desc then id asc', () => {
      db.prepare("INSERT INTO tags (name, is_preset) VALUES ('工作', 1)").run();
      repo.create({ name: '阅读' });
      repo.create({ name: '运动' });

      const tags = repo.findAll();
      expect(tags).toHaveLength(3);
      expect(tags[0].is_preset).toBe(true);
    });

    it('returns empty array when no tags', () => {
      expect(repo.findAll()).toEqual([]);
    });
  });

  describe('findById', () => {
    it('returns tag when found', () => {
      const created = repo.create({ name: '学习' });
      const found = repo.findById(created.id);
      expect(found).toEqual(created);
    });

    it('returns null for non-existent id', () => {
      expect(repo.findById(999)).toBeNull();
    });
  });

  describe('findByName', () => {
    it('returns tag when name matches', () => {
      repo.create({ name: '运动' });
      const found = repo.findByName('运动');
      expect(found).not.toBeNull();
      expect(found!.name).toBe('运动');
    });

    it('returns null when name not found', () => {
      expect(repo.findByName('不存在')).toBeNull();
    });
  });

  describe('delete', () => {
    it('deletes existing tag and returns true', () => {
      const tag = repo.create({ name: '待删标签' });
      expect(repo.delete(tag.id)).toBe(true);
      expect(repo.findById(tag.id)).toBeNull();
    });

    it('returns false for non-existent id', () => {
      expect(repo.delete(999)).toBe(false);
    });
  });

  describe('is_preset conversion', () => {
    it('correctly converts is_preset integer to boolean', () => {
      db.prepare("INSERT INTO tags (name, is_preset) VALUES ('预置', 1)").run();
      const tags = repo.findAll();
      const preset = tags.find((t) => t.name === '预置');
      expect(preset!.is_preset).toBe(true);
    });

    it('custom tag has is_preset = false', () => {
      const tag = repo.create({ name: '自定义' });
      expect(tag.is_preset).toBe(false);
    });
  });

  describe('UNIQUE constraint', () => {
    it('throws on duplicate name', () => {
      repo.create({ name: '唯一标签' });
      expect(() => repo.create({ name: '唯一标签' })).toThrow();
    });
  });
});
