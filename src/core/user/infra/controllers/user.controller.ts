import { CreateUserUseCase } from '@/core/user/application/usecase/create-user.usecase';
import { Body, Controller, Post, Put } from '@nestjs/common';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UserPresenter } from '@/shared/infra/presenter/user/user.presenter';
import { ConvertPresenter } from '@/shared/infra/presenter/converter/converter.presenter';
import {
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  Permission,
  Public,
} from '@/shared/infra/decorators/permission.decorator';
import { UpdateUserUseCase } from '../../application/usecase/update-user.usecase';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { PermissionUser } from '@/core/auth/domain/permissions-definition/user';

@ApiTags('Users')
@Controller('/v1/user')
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
  ) {}

  @Post()
  @Permission(PermissionUser.USER_CREATE)
  @ApiOperation({ summary: 'Usuário' })
  @ApiBody({ type: CreateUserDto })
  @ApiCreatedResponse({
    description: 'Usuário criado com sucesso',
    type: UserPresenter,
  })
  @ApiConflictResponse({ description: 'Usuário á existente' })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor',
  })
  async create(@Body() body: CreateUserDto): Promise<UserPresenter> {
    const output = await this.createUserUseCase.execute(body);

    const presenter = ConvertPresenter.toPresenter(output, UserPresenter);

    return presenter;
  }

  @Put()
  @Permission(PermissionUser.USER_UPDATE)
  async update(@Body() body: UpdateUserDto): Promise<UserPresenter> {
    const output = await this.updateUserUseCase.execute(body);

    const presenter = ConvertPresenter.toPresenter(output, UserPresenter);

    return presenter;
  }
}
