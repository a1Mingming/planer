import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';

// Must mock before importing the module under test
vi.mock('../../../infrastructure/db/connection', () => ({
  getDb: vi.fn(),
}));

import { getDb } from '../../../infrastructure/db/connection';
import { SqlitePlanRepository } from '../../../infrastructure/repositories/SqlitePlanRepository';

let db: Database.Database;

function runMigrate(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS plans (
      id                   INTEGER PRIMARY KEY AUTOINCREMENT,
      title                TEXT    NOT NULL,
      date                 TEXT    NOT NULL,
      start_time           TEXT,
      end_time             TEXT,
      tags                 TEXT,
      done                 INTEGER NOT NULL DEFAULT 0,
      priority             INTEGER NOT NULL DEFAULT 1,
      recurrence_type      TEXT    NOT NULL DEFAULT 'none',
      recurrence_days      TEXT,
      recurrence_end_date  TEXT,
      recurrence_group_id  TEXT,
      created_at TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_plans_date ON plans(date);
    CREATE INDEX IF NOT EXISTS idx_plans_date_done ON plans(date, done);
  `);
}

const BASE_DTO = {
  start_time: null as string | null,
  end_time: null as string | null,
  priority: 1 as 1 | 2 | 3,
  recurrence_type: 'none' as const,
  recurrence_days: null as number[] | null,
  recurrence_end_date: null as string | null,
  recurrence_group_id: null as string | null,
};

describe('SqlitePlanRepository (integration)', () => {
  let repo: SqlitePlanRepository;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('journal_mode = WAL');
    runMigrate(db);
    vi.mocked(getDb).mockReturnValue(db);
    repo = new SqlitePlanRepository();
  });

  afterEach(() => {
    db.close();
    vi.mocked(getDb).mockReset();
  });

  describe('create and findById', () => {
    it('creates a plan and retrieves it by id', () => {
      const plan = repo.create({
        ...BASE_DTO,
        title: '测试计划',
        date: '2026-06-29',
        tags: ['工作'],
        done: false,
      });
      expect(plan.id).toBeGreaterThan(0);
      expect(plan.title).toBe('测试计划');
      expect(plan.date).toBe('2026-06-29');
      expect(plan.tags).toEqual(['工作']);
      expect(plan.done).toBe(false);
      expect(plan.start_time).toBeNull();

      const found = repo.findById(plan.id);
      expect(found).toEqual(plan);
    });

    it('returns null for non-existent id', () => {
      expect(repo.findById(999)).toBeNull();
    });
  });

  describe('findByView', () => {
    beforeEach(() => {
      repo.create({ ...BASE_DTO, title: '六月计划', date: '2026-06-15', tags: [], done: false });
      repo.create({ ...BASE_DTO, title: '七月计划', date: '2026-07-01', tags: [], done: true });
      repo.create({ ...BASE_DTO, title: '日计划', date: '2026-06-29', tags: [], done: false });
    });

    it('finds plans by specific day', () => {
      const plans = repo.findByView('day', '2026-06-29');
      expect(plans).toHaveLength(1);
      expect(plans[0].title).toBe('日计划');
    });

    it('finds plans by month', () => {
      const plans = repo.findByView('month', '2026-06');
      expect(plans).toHaveLength(2);
      const titles = plans.map((p) => p.title);
      expect(titles).toContain('六月计划');
      expect(titles).toContain('日计划');
    });

    it('finds plans by year (all records)', () => {
      const plans = repo.findByView('year', '2026');
      expect(plans).toHaveLength(3);
    });

    it('returns empty array when no plans match', () => {
      const plans = repo.findByView('day', '2020-01-01');
      expect(plans).toEqual([]);
    });
  });

  describe('update', () => {
    it('updates existing plan fields', () => {
      const plan = repo.create({ ...BASE_DTO, title: '原标题', date: '2026-06-29', tags: [], done: false });
      const updated = repo.update(plan.id, { title: '新标题', done: true });
      expect(updated).not.toBeNull();
      expect(updated!.title).toBe('新标题');
      expect(updated!.done).toBe(true);
    });

    it('returns null for non-existent id', () => {
      expect(repo.update(999, { title: '不存在' })).toBeNull();
    });

    it('persists tag changes', () => {
      const plan = repo.create({ ...BASE_DTO, title: '计划', date: '2026-06-29', tags: ['工作'], done: false });
      const updated = repo.update(plan.id, { tags: ['工作', '学习'] });
      expect(updated!.tags).toEqual(['工作', '学习']);
    });

    it('clears tags when updated to empty array', () => {
      const plan = repo.create({ ...BASE_DTO, title: '计划', date: '2026-06-29', tags: ['工作'], done: false });
      const updated = repo.update(plan.id, { tags: [] });
      expect(updated!.tags).toEqual([]);
    });
  });

  describe('delete', () => {
    it('deletes existing plan and returns true', () => {
      const plan = repo.create({ ...BASE_DTO, title: '待删计划', date: '2026-06-29', tags: [], done: false });
      expect(repo.delete(plan.id)).toBe(true);
      expect(repo.findById(plan.id)).toBeNull();
    });

    it('returns false for non-existent id', () => {
      expect(repo.delete(999)).toBe(false);
    });
  });

  describe('getYearSummary', () => {
    it('returns aggregated monthly statistics', () => {
      repo.create({ ...BASE_DTO, title: 'A', date: '2026-06-01', tags: [], done: false });
      repo.create({ ...BASE_DTO, title: 'B', date: '2026-06-02', tags: [], done: true });
      repo.create({ ...BASE_DTO, title: 'C', date: '2026-07-01', tags: [], done: false });

      const summary = repo.getYearSummary('2026');
      expect(summary).toHaveLength(2);

      const june = summary.find((s) => s.month === '2026-06');
      expect(june).toBeDefined();
      expect(june!.total).toBe(2);
      expect(june!.done).toBe(1);

      const july = summary.find((s) => s.month === '2026-07');
      expect(july!.total).toBe(1);
      expect(july!.done).toBe(0);
    });

    it('returns empty array when no plans exist for year', () => {
      expect(repo.getYearSummary('1999')).toEqual([]);
    });
  });

  describe('tags serialization', () => {
    it('stores and retrieves multiple tags correctly', () => {
      const plan = repo.create({
        ...BASE_DTO,
        title: '多标签计划',
        date: '2026-06-29',
        tags: ['工作', '学习', '健身'],
        done: false,
      });
      const found = repo.findById(plan.id)!;
      expect(found.tags).toEqual(['工作', '学习', '健身']);
    });

    it('stores and retrieves empty tags as empty array', () => {
      const plan = repo.create({ ...BASE_DTO, title: '无标签', date: '2026-06-29', tags: [], done: false });
      expect(repo.findById(plan.id)!.tags).toEqual([]);
    });
  });
});
