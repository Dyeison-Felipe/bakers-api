import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { LoginDto } from '../dtos/login.dto';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LoginUseCase } from '../../application/usecase/login.usecase';
import { LoginPresenter } from '@/shared/infra/presenter/login/login.presenter';
import { Public } from '@/shared/infra/decorators/permission.decorator';
import { ForgotPasswordUseCase } from '../../application/usecase/forgot-password.usecase';
import { ForgotPasswordDto } from '../dtos/forgot-password.dto';
import { VerifyCodeDto } from '../dtos/verify-code.dto';
import { VerifyCodeUseCase } from '../../application/usecase/verify-code.usecase';
import { repl } from '@nestjs/core';
import { UpdatePasswordUseCase } from '../../application/usecase/update-password.usecase';
import { UpdatePasswordDto } from '../dtos/update-password.dto';
import { AuthConstants } from '@/shared/application/constants/auth-constants';
import { LogoutUseCase } from '../../application/usecase/logout.usecase';
import { VerifyEmailUseCase } from '../../application/usecase/verify-email.usecase';
import { VerifyEmailDto } from '../dtos/verify-email.dto';

@ApiTags('Auth')
@Controller('/v1/auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly verifyCodeUseCase: VerifyCodeUseCase,
    private readonly updatePasswordUseCase: UpdatePasswordUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
  ) {}

  @Post('/login')
  @Public()
  @ApiOperation({ summary: 'Login' })
  @ApiBody({ type: LoginDto })
  @ApiCreatedResponse({
    description: 'Login realizado com sucesso',
    type: LoginPresenter,
  })
  @ApiUnauthorizedResponse({ description: 'Credenciais inválidas' })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor',
  })
  async login(
    @Res({ passthrough: true }) reply: FastifyReply,
    @Body() loginRequestDto: LoginDto,
  ): Promise<LoginPresenter> {
    return await this.loginUseCase.execute({
      ...loginRequestDto,
      setCookie: reply.setCookie.bind(reply),
    });
  }

  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  @Public()
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    await this.forgotPasswordUseCase.execute(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('verify-code')
  @Public()
  async verifyCode(
    @Res({ passthrough: true }) reply: FastifyReply,
    @Body() dto: VerifyCodeDto,
  ): Promise<void> {
    await this.verifyCodeUseCase.execute({
      ...dto,
      setCookie: reply.setCookie.bind(reply),
    });
  }

  @HttpCode(HttpStatus.OK)
  @Post('update-password')
  @Public()
  async updatePassword(
    @Body() dto: UpdatePasswordDto,
    @Req() req: FastifyRequest,
  ): Promise<void> {
    await this.updatePasswordUseCase.execute({ password: dto.password, req });
  }

  @HttpCode(HttpStatus.OK)
  @Get('verify-email')
  @Public()
  @ApiOperation({ summary: 'Verifica o e-mail do usuário a partir do token enviado por e-mail' })
  async verifyEmail(@Query() dto: VerifyEmailDto): Promise<void> {
    await this.verifyEmailUseCase.execute(dto);
  }

  @ApiOperation({ summary: 'Faz o logout de um usuário' })
  @ApiResponse({
    status: 204,
  })
  @ApiResponse({
    status: 500,
    description: 'Erro desconhecido',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Public()
  @Post('/logout')
  async logout(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    return await this.logoutUseCase.execute({
      clearCookie: reply.clearCookie.bind(reply),
      // token: request.cookies[AuthConstants.tokenName],
    });
  }
}
