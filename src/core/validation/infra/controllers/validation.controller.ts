import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@/shared/infra/decorators/permission.decorator';
import { SimpleRateLimitGuard } from '@/shared/infra/guards/simple-rate-limit.guard';
import { CheckEmailDomainUseCase } from '../../application/usecase/check-email-domain.usecase';
import { CheckEmailDomainDto } from '../dtos/check-email-domain.dto';

@ApiTags('Validation')
@Controller('/v1/validation')
export class ValidationController {
  constructor(private readonly checkEmailDomainUseCase: CheckEmailDomainUseCase) {}

  // Pública: usada também no cadastro de empresa, antes de existir login.
  @Post('email-domain')
  @Public()
  @UseGuards(SimpleRateLimitGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verifica se o domínio do e-mail recebe mensagens (registro MX)' })
  async checkEmailDomain(@Body() dto: CheckEmailDomainDto): Promise<{ valid: boolean }> {
    return await this.checkEmailDomainUseCase.execute(dto);
  }
}
