import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsEmailDomain } from '@/shared/infra/validators/is-email-domain.decorator';


export class CreateUserDto {
  @ApiProperty({
    description: 'username do usuário',
    type: String,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  username: string;

  @ApiProperty({
    description: 'Nome completo do usuário',
    type: String,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsUUID()
  role: string;

  @ApiProperty({
    description: 'Senha do usuário',
    type: String,
    maxLength: 255,
  })
  @IsString()
  @MaxLength(100)
  @MinLength(8)
  password: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  @IsEmailDomain()
  email: string;

  @ApiProperty({
    description: 'IDs das permissões do usuário',
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  permissionsId: string[];
}
