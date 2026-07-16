import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class RegisterPortalDto {
  @ApiProperty({ example: 'pharmatrustlimited' })
  @IsString()
  @MaxLength(120)
  slug!: string;

  @ApiProperty({ example: 'Pharmatrust Limited' })
  @IsString()
  @MaxLength(200)
  companyName!: string;

  @ApiProperty({ example: 'admin@pharmatrust.com' })
  @IsEmail()
  clientAdminEmail!: string;

  @ApiPropertyOptional({ example: 'College attendance portal' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    example:
      'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_128/company-logo.webp',
  })
  @IsOptional()
  @IsUrl({ require_protocol: true }, { message: 'logoUrl must be a valid URL' })
  @MaxLength(2048)
  logoUrl?: string;
}
