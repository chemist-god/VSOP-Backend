import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class RegisterPortalDto {
  @ApiProperty({ example: 'pharmatrustlimited' })
  @IsString()
  slug!: string;

  @ApiProperty({ example: 'Pharmatrust Limited' })
  @IsString()
  companyName!: string;

  @ApiProperty({ example: 'admin@pharmatrust.com' })
  @IsEmail()
  clientAdminEmail!: string;

  @ApiPropertyOptional({ example: 'College attendance portal' })
  @IsOptional()
  @IsString()
  description?: string;
}
