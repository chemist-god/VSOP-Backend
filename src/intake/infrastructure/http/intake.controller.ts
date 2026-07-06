import {
  Body,
  Controller,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { memoryStorage } from 'multer';
import { Inject } from '@nestjs/common';
import { SubmitTicketUseCase } from '@tickets/application/use-cases/submit-ticket/submit-ticket.use-case';
import { SubmitTicketCommand } from '@tickets/application/use-cases/submit-ticket/submit-ticket.command';
import { PortalApiKeyGuard, PortalRequestContext } from '@shared/infrastructure/guards/portal-api-key.guard';
import { Public } from '@shared/infrastructure/guards/public.decorator';
import { InternalSubmitTicketDto, SubmitTicketDto } from './dto/submit-ticket.dto';
import { VsopServiceKeyGuard } from '../guards/vsop-service-key.guard';
import { STORAGE_PORT, StoragePort } from '@storage/application/ports/storage.port';

@Controller('intake')
@UseGuards(ThrottlerGuard)
export class IntakeController {
  constructor(
    private readonly submitTicketUseCase: SubmitTicketUseCase,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
  ) {}

  @Post('submit')
  @Public()
  @UseGuards(PortalApiKeyGuard)
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  @UseInterceptors(
    FilesInterceptor('screenshots', 3, {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async submitPublic(
    @Req() request: PortalRequestContext,
    @Body() body: SubmitTicketDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    const screenshotUrls = await this.storage.uploadScreenshots(files ?? [], request.portal.slug);
    const result = await this.submitTicketUseCase.execute(
      new SubmitTicketCommand(
        request.portal.id,
        request.portal.slug,
        body.description,
        body.contactName,
        body.browserInfo,
        screenshotUrls,
        body.category,
        body.tags,
      ),
    );

    return {
      success: true,
      reference_id: result.referenceId,
      message: `Your issue has been received. Reference: ${result.referenceId}`,
      ...result,
    };
  }

  @Post('internal')
  @Public()
  @UseGuards(VsopServiceKeyGuard)
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  @UseInterceptors(
    FilesInterceptor('screenshots', 3, {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async submitInternal(
    @Req() request: PortalRequestContext,
    @Body() body: InternalSubmitTicketDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    const screenshotUrls = await this.storage.uploadScreenshots(files ?? [], request.portal.slug);
    const result = await this.submitTicketUseCase.execute(
      new SubmitTicketCommand(
        request.portal.id,
        request.portal.slug,
        body.description,
        body.contactName,
        body.browserInfo,
        screenshotUrls,
        body.category,
        body.tags,
      ),
    );

    return {
      success: true,
      reference_id: result.referenceId,
      message: `Your issue has been received. Reference: ${result.referenceId}`,
      ...result,
    };
  }
}
