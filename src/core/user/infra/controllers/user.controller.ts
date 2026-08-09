import { CreateUserUseCase } from '@/core/user/application/usecase/create-user.usecase';
import { Body, Controller, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UserPresenter } from '@/shared/infra/presenter/user/user.presenter';
import { FindAllUsersPresenter } from '@/shared/infra/presenter/user/find-all-users.presenter';
import { ConvertPresenter } from '@/shared/infra/presenter/converter/converter.presenter';
import {
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Permission } from '@/shared/infra/decorators/permission.decorator';
import { UpdateUserUseCase } from '../../application/usecase/update-user.usecase';
import { FindAllUsersUseCase } from '../../application/usecase/find-all-users.usecase';
import { FindUserByIdUseCase } from '../../application/usecase/find-user-by-id.usecase';
import { InactivateUserUseCase } from '../../application/usecase/inactivate-user.usecase';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { PermissionUser } from '@/core/auth/domain/permissions-definition/user';
import { Pagination } from '@/shared/infra/presenter/pagination/pagination.presenter';

@ApiTags('Users')
@Controller('/v1/user')
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly findAllUsersUseCase: FindAllUsersUseCase,
    private readonly findUserByIdUseCase: FindUserByIdUseCase,
    private readonly inactivateUserUseCase: InactivateUserUseCase,
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

  @Get()
  @Permission(PermissionUser.USER_READER)
  @ApiOperation({
    summary: 'Listar usuários',
    description: 'Lista os usuários da empresa do usuário logado.',
  })
  async findAll(
    @Query('page') page: number = 1,
    @Query('direction') direction: 'ASC' | 'DESC' = 'DESC',
    @Query('limit') limit = 10,
  ): Promise<Pagination<FindAllUsersPresenter>> {
    const output = await this.findAllUsersUseCase.execute({
      pagination: { page, direction, limit },
    });

    return ConvertPresenter.toPaginationPresenter(
      output,
      FindAllUsersPresenter,
    );
  }

  @Get(':id')
  @Permission(PermissionUser.USER_READER)
  @ApiOperation({ summary: 'Buscar usuário' })
  async findById(@Param('id') id: string): Promise<UserPresenter> {
    const output = await this.findUserByIdUseCase.execute({ id });

    return ConvertPresenter.toPresenter(output, UserPresenter);
  }

  @Patch(':id/inactivate')
  @Permission(PermissionUser.USER_DELETE)
  @ApiOperation({ summary: 'Inativar usuário' })
  async inactivate(@Param('id') id: string): Promise<void> {
    await this.inactivateUserUseCase.execute({ id });
  }
}
