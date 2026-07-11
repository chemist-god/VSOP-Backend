import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class InviteUserDto {
  @ApiProperty({ example: 'Kwame Mensah' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 'kwame@veritrack.cloud' })
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.DEVELOPER })
  @IsEnum(UserRole)
  role!: UserRole;
}

export class AcceptInviteDto {
  @ApiProperty()
  @IsString()
  @MinLength(20)
  token!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class UpdateMeDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  name!: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  currentPassword!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}

export class UpdateUserStatusDto {
  @ApiProperty({
    description: 'false removes the member from the team and blocks login',
    example: false,
  })
  @IsBoolean()
  isActive!: boolean;
}
