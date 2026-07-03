import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '@shared/infrastructure/guards/public.decorator';
import { LoginUseCase } from '@auth/application/use-cases/login/login.use-case';
import { LoginCommand } from '@auth/application/use-cases/login/login.command';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly loginUseCase: LoginUseCase) {}

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Returns access and refresh tokens' })
  async login(@Body() dto: LoginDto) {
    return this.loginUseCase.execute(new LoginCommand(dto.email, dto.password));
  }
}
