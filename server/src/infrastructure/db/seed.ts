import { getDb } from './connection';

const PRESET_TAGS = ['工作', '学习', '健身', '生活', '其他'];

export function seed(): void {
  const db = getDb();
  const insert = db.prepare(
    'INSERT OR IGNORE INTO tags (name, is_preset) VALUES (?, 1)'
  );
  for (const name of PRESET_TAGS) {
    insert.run(name);
  }
}
