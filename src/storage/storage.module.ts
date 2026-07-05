import { Module } from '@nestjs/common';
import { STORAGE_PORT } from './application/ports/storage.port';
import { CloudinaryStorageAdapter } from './infrastructure/cloudinary-storage.adapter';

@Module({
  providers: [{ provide: STORAGE_PORT, useClass: CloudinaryStorageAdapter }],
  exports: [STORAGE_PORT],
})
export class StorageModule {}
