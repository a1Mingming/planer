import { getDb } from './connection';

export function migrate(): void {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS plans (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      title      TEXT    NOT NULL,
      date       TEXT    NOT NULL,
      start_time TEXT,
      end_time   TEXT,
      tags       TEXT,
      done       INTEGER NOT NULL DEFAULT 0,
      created_at TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_plans_date ON plans(date);
    CREATE INDEX IF NOT EXISTS idx_plans_date_done ON plans(date, done);

    CREATE TABLE IF NOT EXISTS tags (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      name      TEXT    NOT NULL UNIQUE,
      is_preset INTEGER NOT NULL DEFAULT 0
    );
  `);

  // 增量迁移：新增字段（IF NOT EXISTS 等价，用 try/catch 兼容 SQLite）
  const alterColumns = [
    `ALTER TABLE plans ADD COLUMN priority INTEGER NOT NULL DEFAULT 1`,
    `ALTER TABLE plans ADD COLUMN recurrence_type TEXT NOT NULL DEFAULT 'none'`,
    `ALTER TABLE plans ADD COLUMN recurrence_days TEXT`,
    `ALTER TABLE plans ADD COLUMN recurrence_end_date TEXT`,
    `ALTER TABLE plans ADD COLUMN recurrence_group_id TEXT`,
  ];
  for (const sql of alterColumns) {
    try { db.exec(sql); } catch { /* 字段已存在，忽略 */ }
  }

  db.exec(`CREATE INDEX IF NOT EXISTS idx_plans_recurrence_group ON plans(recurrence_group_id);`);
}
