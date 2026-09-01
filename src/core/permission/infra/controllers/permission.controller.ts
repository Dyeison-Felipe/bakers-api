import { Controller, Get } from '@nestjs/common';
import { ConvertPresenter } from '@/shared/infra/presenter/converter/converter.presenter';
import { FindAllPermission } from '@/shared/infra/presenter/permission/find-all-permission.presenter';
import { AllowSuperAdmin } from '@/shared/infra/decorators/permission.decorator';
import { FindAllPermissionsUseCase } from '../../application/usecase/find-all-permissions';

@Controller('permission/v1')
export class PermissionController {
  constructor(
    private readonly findAllPermissionsUseCase: FindAllPermissionsUseCase,
  ) {}

  @Get('/find-all')
  @AllowSuperAdmin()
  async findAllPermission(): Promise<FindAllPermission[]> {
    const execute = await this.findAllPermissionsUseCase.execute();

    const presenter = ConvertPresenter.toPresenterList(
      execute,
      FindAllPermission,
    );

    return presenter;
  }
}
