import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsNumber, IsString, IsUUID, Min } from "class-validator";

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

  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  permissionIds: string[];
}