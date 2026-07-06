import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketCategory } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class SubmitTicketDto {
  @ApiProperty({ example: 'Cannot check out due to script error' })
  @IsString()
  @MaxLength(5000)
  description!: string;

  @ApiPropertyOptional({ example: 'hr@pharmatrust.com' })
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional({ example: { page_url: 'https://veritrack.cloud/pharmatrustlimited' } })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as Record<string, unknown>;
      } catch {
        return undefined;
      }
    }
    return value;
  })
  @IsObject()
  browserInfo?: Record<string, unknown>;

  @ApiPropertyOptional({ enum: TicketCategory })
  @IsOptional()
  @IsEnum(TicketCategory)
  category?: TicketCategory;

  @ApiPropertyOptional({ example: ['checkout', 'urgent'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class InternalSubmitTicketDto extends SubmitTicketDto {
  @ApiProperty({ example: 'pharmatrustlimited' })
  @IsString()
  portal_slug!: string;
}
