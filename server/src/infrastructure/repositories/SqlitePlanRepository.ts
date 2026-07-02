import type { Plan, CreatePlanDto, UpdatePlanDto, RecurrenceScope } from '../../domain/plan/Plan';
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
  priority: number;
  recurrence_type: string;
  recurrence_days: string | null;
  recurrence_end_date: string | null;
  recurrence_group_id: string | null;
  created_at: string;
  updated_at: string;
}

function rowToPlan(row: PlanRow): Plan {
  return {
    ...row,
    tags: row.tags ? (JSON.parse(row.tags) as string[]) : [],
    done: row.done === 1,
    priority: (row.priority ?? 1) as 1 | 2 | 3,
    recurrence_type: (row.recurrence_type ?? 'none') as Plan['recurrence_type'],
    recurrence_days: row.recurrence_days ? (JSON.parse(row.recurrence_days) as number[]) : null,
    recurrence_end_date: row.recurrence_end_date ?? null,
    recurrence_group_id: row.recurrence_group_id ?? null,
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

  search(q: string): Plan[] {
    const db = getDb();
    const pattern = `%${q}%`;
    const rows = db.prepare(`
      SELECT * FROM plans
      WHERE title LIKE ? OR tags LIKE ?
      ORDER BY date DESC, start_time ASC
      LIMIT 100
    `).all(pattern, pattern) as PlanRow[];
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
      INSERT INTO plans (title, date, start_time, end_time, tags, done, priority, recurrence_type, recurrence_days, recurrence_end_date, recurrence_group_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      dto.title,
      dto.date,
      dto.start_time ?? null,
      dto.end_time ?? null,
      dto.tags?.length ? JSON.stringify(dto.tags) : null,
      dto.done ? 1 : 0,
      dto.priority ?? 1,
      dto.recurrence_type ?? 'none',
      dto.recurrence_days?.length ? JSON.stringify(dto.recurrence_days) : null,
      dto.recurrence_end_date ?? null,
      dto.recurrence_group_id ?? null,
    );
    return this.findById(result.lastInsertRowid as number)!;
  }

  createBatch(dtos: CreatePlanDto[]): Plan[] {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO plans (title, date, start_time, end_time, tags, done, priority, recurrence_type, recurrence_days, recurrence_end_date, recurrence_group_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertMany = db.transaction((items: CreatePlanDto[]) => {
      const ids: number[] = [];
      for (const dto of items) {
        const result = stmt.run(
          dto.title,
          dto.date,
          dto.start_time ?? null,
          dto.end_time ?? null,
          dto.tags?.length ? JSON.stringify(dto.tags) : null,
          dto.done ? 1 : 0,
          dto.priority ?? 1,
          dto.recurrence_type ?? 'none',
          dto.recurrence_days?.length ? JSON.stringify(dto.recurrence_days) : null,
          dto.recurrence_end_date ?? null,
          dto.recurrence_group_id ?? null,
        );
        ids.push(result.lastInsertRowid as number);
      }
      return ids;
    });
    const ids = insertMany(dtos);
    return ids.map((id) => this.findById(id)!);
  }

  updateByGroup(groupId: string, scope: RecurrenceScope, fromDate: string, dto: UpdatePlanDto): void {
    const db = getDb();
    const setParts: string[] = [
      'updated_at = datetime(\'now\',\'localtime\')',
    ];
    const params: unknown[] = [];

    if (dto.title !== undefined)      { setParts.push('title = ?');      params.push(dto.title); }
    if (dto.start_time !== undefined) { setParts.push('start_time = ?'); params.push(dto.start_time); }
    if (dto.end_time !== undefined)   { setParts.push('end_time = ?');   params.push(dto.end_time); }
    if (dto.tags !== undefined)       { setParts.push('tags = ?');       params.push(dto.tags.length ? JSON.stringify(dto.tags) : null); }
    if (dto.priority !== undefined)   { setParts.push('priority = ?');   params.push(dto.priority); }

    if (setParts.length === 1) return; // only updated_at, nothing to do

    const whereClause = scope === 'all'
      ? 'WHERE recurrence_group_id = ? AND done = 0'
      : 'WHERE recurrence_group_id = ? AND date >= ? AND done = 0';

    params.push(groupId);
    if (scope === 'future') params.push(fromDate);

    db.prepare(`UPDATE plans SET ${setParts.join(', ')} ${whereClause}`).run(...params);
  }

  deleteByGroup(groupId: string, scope: RecurrenceScope, fromDate: string, today: string): void {
    const db = getDb();
    if (scope === 'all') {
      db.prepare('DELETE FROM plans WHERE recurrence_group_id = ? AND done = 0 AND date > ?').run(groupId, today);
    } else if (scope === 'future') {
      db.prepare('DELETE FROM plans WHERE recurrence_group_id = ? AND date >= ? AND done = 0 AND date > ?').run(groupId, fromDate, today);
    }
  }

  countByGroup(groupId: string, scope: RecurrenceScope, fromDate: string, today: string): number {
    const db = getDb();
    let row: { cnt: number };
    if (scope === 'all') {
      row = db.prepare(
        'SELECT COUNT(*) AS cnt FROM plans WHERE recurrence_group_id = ? AND done = 0 AND date > ?'
      ).get(groupId, today) as { cnt: number };
    } else {
      row = db.prepare(
        'SELECT COUNT(*) AS cnt FROM plans WHERE recurrence_group_id = ? AND date >= ? AND done = 0 AND date > ?'
      ).get(groupId, fromDate, today) as { cnt: number };
    }
    return row?.cnt ?? 0;
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
        priority   = ?,
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
      dto.priority ?? existing.priority,
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
