export interface Tag {
  id: number;
  name: string;
  is_preset: boolean;
}

export type CreateTagDto = { name: string };
