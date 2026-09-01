import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreatePlanDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  duration: number;

  // null = plano sem limite de usuários (ilimitado)
  @IsOptional()
  @IsInt()
  @Min(1)
  userLimit: number | null;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  permissionIds: string[];
}
