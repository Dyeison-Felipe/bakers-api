import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  MONEY_MAX,
  PLAN_DURATION_MAX_DAYS,
  PLAN_USER_LIMIT_MAX,
} from '@/shared/domain/constants/field-limits';


export class CreatePlanDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description: string;

  @IsArray()
  @IsString({ each: true })
  @MaxLength(255, { each: true })
  features: string[];

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(MONEY_MAX)
  price: number;

  @IsInt()
  @Min(1)
  @Max(PLAN_DURATION_MAX_DAYS)
  @IsNotEmpty()
  duration: number;

  // null = plano sem limite de usuários (ilimitado)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(PLAN_USER_LIMIT_MAX)
  userLimit: number | null;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  permissionIds: string[];
}
