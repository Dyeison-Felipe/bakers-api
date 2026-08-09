import { Controller, Get } from '@nestjs/common';
import { FindAllRolesUseCase } from '../../application/usecase/find-all-roles.usecase';
import { ConvertPresenter } from '@/shared/infra/presenter/converter/converter.presenter';
import { RolePresenter } from '@/shared/infra/presenter/role/role.presenter';
import { Permission } from '@/shared/infra/decorators/permission.decorator';
import { PermissionUser } from '@/core/auth/domain/permissions-definition/user';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Roles')
@Controller('v1/role')
export class RoleController {
  constructor(private readonly findAllRolesUseCase: FindAllRolesUseCase) {}

  @Get()
  @Permission(PermissionUser.USER_READER)
  @ApiOperation({
    summary: 'Listar cargos',
    description: 'Lista os cargos disponíveis na empresa do usuário logado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de cargos',
    type: [RolePresenter],
  })
  async findAll(): Promise<RolePresenter[]> {
    const output = await this.findAllRolesUseCase.execute();

    return ConvertPresenter.toPresenterList(output, RolePresenter);
  }
}
