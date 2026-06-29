import type { Tag, CreateTagDto } from '../../domain/tag/Tag';
import type { ITagRepository } from '../../domain/tag/ITagRepository';
import { getDb } from '../db/connection';

interface TagRow {
  id: number;
  name: string;
  is_preset: number;
}

function rowToTag(row: TagRow): Tag {
  return { id: row.id, name: row.name, is_preset: row.is_preset === 1 };
}

export class SqliteTagRepository implements ITagRepository {
  findAll(): Tag[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM tags ORDER BY is_preset DESC, id ASC').all() as TagRow[];
    return rows.map(rowToTag);
  }

  findById(id: number): Tag | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM tags WHERE id = ?').get(id) as TagRow | undefined;
    return row ? rowToTag(row) : null;
  }

  findByName(name: string): Tag | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM tags WHERE name = ?').get(name) as TagRow | undefined;
    return row ? rowToTag(row) : null;
  }

  create(dto: CreateTagDto): Tag {
    const db = getDb();
    const result = db.prepare('INSERT INTO tags (name, is_preset) VALUES (?, 0)').run(dto.name);
    return this.findById(result.lastInsertRowid as number)!;
  }

  delete(id: number): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM tags WHERE id = ?').run(id);
    return result.changes > 0;
  }
}
