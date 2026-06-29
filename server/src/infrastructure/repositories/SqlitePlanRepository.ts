import type { Plan, CreatePlanDto, UpdatePlanDto } from '../../domain/plan/Plan';
import type { IPlanRepository } from '../../domain/plan/IPlanRepository';
import { getDb } from '../db/connection';

interface PlanRow {
  id: number;
  title: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  tags: string | null;
  done: number;
  created_at: string;
  updated_at: string;
}

function rowToPlan(row: PlanRow): Plan {
  return {
    ...row,
    tags: row.tags ? (JSON.parse(row.tags) as string[]) : [],
    done: row.done === 1,
  };
}

export class SqlitePlanRepository implements IPlanRepository {
  findByView(view: 'year' | 'month' | 'day', date: string): Plan[] {
    const db = getDb();
    let pattern: string;
    let query: string;

    if (view === 'year') {
      pattern = `${date}-%`;
      query = 'SELECT * FROM plans WHERE date LIKE ? ORDER BY date ASC, start_time ASC';
    } else if (view === 'month') {
      pattern = `${date}-%`;
      query = 'SELECT * FROM plans WHERE date LIKE ? ORDER BY date ASC, start_time ASC';
    } else {
      pattern = date;
      query = 'SELECT * FROM plans WHERE date = ? ORDER BY start_time ASC';
    }

    const rows = db.prepare(query).all(pattern) as PlanRow[];
    return rows.map(rowToPlan);
  }

  findById(id: number): Plan | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM plans WHERE id = ?').get(id) as PlanRow | undefined;
    return row ? rowToPlan(row) : null;
  }

  create(dto: CreatePlanDto): Plan {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO plans (title, date, start_time, end_time, tags, done)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      dto.title,
      dto.date,
      dto.start_time ?? null,
      dto.end_time ?? null,
      dto.tags?.length ? JSON.stringify(dto.tags) : null,
      dto.done ? 1 : 0,
    );
    return this.findById(result.lastInsertRowid as number)!;
  }

  update(id: number, dto: UpdatePlanDto): Plan | null {
    const db = getDb();
    const existing = this.findById(id);
    if (!existing) return null;

    db.prepare(`
      UPDATE plans SET
        title      = ?,
        date       = ?,
        start_time = ?,
        end_time   = ?,
        tags       = ?,
        done       = ?,
        updated_at = datetime('now','localtime')
      WHERE id = ?
    `).run(
      dto.title ?? existing.title,
      dto.date ?? existing.date,
      dto.start_time !== undefined ? dto.start_time : existing.start_time,
      dto.end_time !== undefined ? dto.end_time : existing.end_time,
      dto.tags !== undefined
        ? (dto.tags.length ? JSON.stringify(dto.tags) : null)
        : (existing.tags.length ? JSON.stringify(existing.tags) : null),
      dto.done !== undefined ? (dto.done ? 1 : 0) : (existing.done ? 1 : 0),
      id,
    );
    return this.findById(id);
  }

  delete(id: number): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM plans WHERE id = ?').run(id);
    return result.changes > 0;
  }

  getYearSummary(year: string): { month: string; total: number; done: number }[] {
    const db = getDb();
    const rows = db.prepare(`
      SELECT
        substr(date, 1, 7) AS month,
        COUNT(*) AS total,
        SUM(done) AS done
      FROM plans
      WHERE date LIKE ?
      GROUP BY substr(date, 1, 7)
      ORDER BY month ASC
    `).all(`${year}-%`) as { month: string; total: number; done: number }[];
    return rows;
  }
}
