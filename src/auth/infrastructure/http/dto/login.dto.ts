import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@veritrack.cloud' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'ChangeMe@2024!' })
  @IsString()
  password!: string;
}
