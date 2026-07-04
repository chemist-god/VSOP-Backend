import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'Kwame Mensah' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'kwame@veritrack.cloud' })
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.DEVELOPER })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiProperty({ example: 'Temp@Pass2024!', minLength: 8 })
  @IsString()
  @MinLength(8)
  temporaryPassword!: string;
}
