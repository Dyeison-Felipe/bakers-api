import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from "class-validator";

export class UpdatePlanDto {

  @IsUUID()
  @IsNotEmpty()
  id: string

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsBoolean()
  @IsNotEmpty()
  active: boolean

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