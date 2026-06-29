export class TagNotFoundError extends Error {
  readonly code = 'TAG_NOT_FOUND';
  constructor(id: number) {
    super(`Tag with id ${id} not found`);
    this.name = 'TagNotFoundError';
  }
}

export class TagAlreadyExistsError extends Error {
  readonly code = 'TAG_ALREADY_EXISTS';
  constructor(name: string) {
    super(`Tag "${name}" already exists`);
    this.name = 'TagAlreadyExistsError';
  }
}

export class TagPresetReadonlyError extends Error {
  readonly code = 'TAG_PRESET_READONLY';
  constructor(name: string) {
    super(`Tag "${name}" is a preset tag and cannot be deleted`);
    this.name = 'TagPresetReadonlyError';
  }
}
