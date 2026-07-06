// import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
// import { UpdateAddressDto } from '../dtos/update-address.dto';
// import { CreateAddressDto } from '../dtos/create-address.dto';
// import {
//   ApiBody,
//   ApiCreatedResponse,
//   ApiOkResponse,
//   ApiOperation,
//   ApiParam,
//   ApiTags,
// } from '@nestjs/swagger';
// import { CreateAddressUseCase } from '../../application/usecase/create-address.usecase';
// import { UpdateAddressUseCase } from '../../application/usecase/update-address.usecase';
// import { CreateAddressPresenter } from '@/shared/infra/presenter/address/create.presenter';
// import { ConvertPresenter } from '@/shared/infra/presenter/converter/converter.presenter';
// import { UpdateAddressPresenter } from '@/shared/infra/presenter/address/update.presenter';
// import { Permission, Public } from '@/shared/infra/decorators/permission.decorator';
// import { PermissionAddress } from '@/core/auth/domain/permissions-definition/address';
// import { FindAddressByCompanyIdUseCase } from '../../application/usecase/find-address-by-id.usecase';
// import { AddressPresenter } from '@/shared/infra/presenter/address/address.preseter';

// @ApiTags('Address')
// @Controller('/addresses/v1')
// export class AddressController {
//   constructor(
//     private readonly createAddressUseCase: CreateAddressUseCase,
//     private readonly updateAddressUseCase: UpdateAddressUseCase,
//     private readonly findAddressByCompanyIdUseCase: FindAddressByCompanyIdUseCase,
//   ) {}

//   // @Permission(PermissionAddress.ADDRESS_CREATE)
//   @Post()
//   @Public()
//   @ApiOperation({ summary: 'Criar endereço' })
//   @ApiBody({ type: CreateAddressDto })
//   @ApiCreatedResponse({ type: CreateAddressPresenter })
//   async createAddress(
//     @Body() body: CreateAddressDto,
//   ): Promise<CreateAddressPresenter> {
//     const execute = await this.createAddressUseCase.execute(body);

//     const output = ConvertPresenter.toPresenter(
//       execute,
//       CreateAddressPresenter,
//     );

//     return output;
//   }

//   @Put('/:id')
//   @ApiOperation({ summary: 'Atualizar endereço' })
//   @ApiParam({ name: 'id', type: String })
//   @ApiBody({ type: UpdateAddressDto })
//   @ApiOkResponse({ type: UpdateAddressPresenter })
//   async updateAddress(
//     @Body() body: UpdateAddressDto,
//   ): Promise<UpdateAddressPresenter> {
//     const execute = await this.updateAddressUseCase.execute(body);

//     const output = ConvertPresenter.toPresenter(
//       execute,
//       UpdateAddressPresenter,
//     );

//     return output;
//   }

//   @ApiOperation({ summary: 'Buscar endereço por id' })
//   @ApiParam({ name: 'id', type: String })
//   @ApiOkResponse({ type: AddressPresenter })
//   @Get(':id')
//   async findAddress(@Param('id') id: string): Promise<AddressPresenter> {
//     return await this.findAddressByCompanyIdUseCase.execute({ id });
//   }
// }
