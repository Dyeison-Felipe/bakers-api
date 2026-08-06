import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsString, IsUUID } from "class-validator";

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

  @IsString()
  @IsNotEmpty()
  duration: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  permissionIds: string[];
}