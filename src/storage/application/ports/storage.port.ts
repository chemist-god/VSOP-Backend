export const STORAGE_PORT = Symbol('StoragePort');

export interface StoragePort {
  uploadScreenshots(files: Express.Multer.File[], portalSlug: string): Promise<string[]>;
}
