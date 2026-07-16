import { Controller, Post } from '@nestjs/common';
import { SyncNcmUseCase } from '../../application/usecase/sync-ncm.usecase';
import { Public } from '@/shared/infra/decorators/permission.decorator';

// só pra teste manual, dá pra remover depois
@Controller('/v1/ncm')
export class NcmController {
  constructor(private readonly syncNcmUseCase: SyncNcmUseCase) {}

  @Post('sync-ncm')
  @Public()
  syncNcm() {
     this.syncNcmUseCase.execute().catch((error) => {
      console.error('Erro na sincronização em background:', error);
    });

    return { message: 'Sincronização iniciada em background' };
  }
}
