import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketCategory, TicketSeverity } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength, ValidateIf } from 'class-validator';

export class CreateTicketDto {
  @ApiProperty({ example: 'Investigate flaky checkout script on staging' })
  @IsString()
  @MaxLength(5000)
  description!: string;

  @ApiPropertyOptional({ description: 'Optional portal link; omit for internal-only tasks' })
  @IsOptional()
  @IsUUID()
  portalId?: string;

  @ApiPropertyOptional({ enum: TicketSeverity })
  @IsOptional()
  @IsEnum(TicketSeverity)
  severity?: TicketSeverity;

  @ApiPropertyOptional({ enum: TicketCategory })
  @IsOptional()
  @IsEnum(TicketCategory)
  category?: TicketCategory;

  @ApiPropertyOptional({ description: 'Assign immediately on create' })
  @ValidateIf((o: CreateTicketDto) => o.assigneeId != null || o.dueDate != null)
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional({ example: '2026-07-15T18:00:00.000Z' })
  @ValidateIf((o: CreateTicketDto) => o.assigneeId != null || o.dueDate != null)
  @IsDateString()
  dueDate?: string;
}
