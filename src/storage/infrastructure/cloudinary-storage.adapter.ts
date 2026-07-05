import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { StoragePort } from '@storage/application/ports/storage.port';

@Injectable()
export class CloudinaryStorageAdapter implements StoragePort {
  private readonly logger = new Logger(CloudinaryStorageAdapter.name);

  constructor(private readonly config: ConfigService) {
    cloudinary.config({
      cloud_name: config.get<string>('cloudinary.cloudName'),
      api_key: config.get<string>('cloudinary.apiKey'),
      api_secret: config.get<string>('cloudinary.apiSecret'),
    });
  }

  async uploadScreenshots(files: Express.Multer.File[], portalSlug: string): Promise<string[]> {
    if (!files?.length) return [];

    const uploads = files.map(async (file) => {
      try {
        const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: `vsop/${portalSlug}`,
              resource_type: 'image',
            },
            (error, uploadResult) => {
              if (error || !uploadResult) {
                reject(error ?? new Error('Cloudinary upload failed'));
                return;
              }
              resolve(uploadResult as { secure_url: string });
            },
          );
          stream.end(file.buffer);
        });
        return result.secure_url;
      } catch (err) {
        this.logger.error(`Failed to upload screenshot for ${portalSlug}`, err);
        return null;
      }
    });

    const results = await Promise.all(uploads);
    return results.filter((url): url is string => url !== null);
  }
}
