export type UploadCategory = 'events' | 'avatars';

export interface StoredFile {
  relativePath: string;
  filename: string;
  category: UploadCategory;
  size: number;
}
