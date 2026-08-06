import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { CreatePlanUseCase } from "../../application/usecase/create-plan.usecase";
import { CreatePlanPresenter } from "@/shared/infra/presenter/plan/create-plan.presenter";
import { CreatePlanDto } from "../dtos/create-plan.dto";
import { UpdatePlanDto } from "../dtos/update-plan.usecase";
import { UpdatePlanPresenter } from "@/shared/infra/presenter/plan/update-plan.presenter";
import { UpdatePlanUseCase } from "../../application/usecase/update-plan.usecase";
import { FindAllPlanUseCase } from "../../application/usecase/find-all-plan.usecase";
import { FindPlanByIdUseCase } from "../../application/usecase/find-plan-by-id.usecase";
import { ConvertPresenter } from "@/shared/infra/presenter/converter/converter.presenter";
import { FindAllPlanPresenter } from "@/shared/infra/presenter/plan/find-all-plan.presenter";
import { FindPlanByIdPresenter } from "@/shared/infra/presenter/plan/find-plan-by-id.presenter";
import { DeletePlanUseCase } from "../../application/usecase/delete.usecase";
import { Public, SuperAdminOnly } from "@/shared/infra/decorators/permission.decorator";

@Controller('v1/plan')
export class PlanController {
  constructor(
    private readonly createPlanUseCase: CreatePlanUseCase,
    private readonly updatePlanUseCase: UpdatePlanUseCase,
    private readonly findAllPlanUseCase: FindAllPlanUseCase,
    private readonly findPlanByIdUseCase: FindPlanByIdUseCase,
    private readonly deletePlanUseCase: DeletePlanUseCase,
  ) { }

  @Post()
  @SuperAdminOnly()
  async create(@Body() dto: CreatePlanDto): Promise<CreatePlanPresenter> {
    return await this.createPlanUseCase.execute(dto);
  }

  @Put()
  @SuperAdminOnly()
  async update(@Body() dto: UpdatePlanDto): Promise<UpdatePlanPresenter> {
    return await this.updatePlanUseCase.execute(dto);
  }

  @Get()
  @Public()
  async findAll(): Promise<FindAllPlanPresenter[]> {
    const output = await this.findAllPlanUseCase.execute();

    return ConvertPresenter.toPresenterList(output, FindAllPlanPresenter);
  }

  @Get(':id')
  @SuperAdminOnly()
  async findById(@Param('id') id: string): Promise<FindPlanByIdPresenter> {
    return await this.findPlanByIdUseCase.execute({ id });
  }

  @Delete(':id')
  @SuperAdminOnly()
  async delete(@Param('id') id: string): Promise<void> {
    await this.deletePlanUseCase.execute({ id })
  }
}