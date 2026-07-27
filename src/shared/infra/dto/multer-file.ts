// multer-file.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsNumber, IsString, IsNotEmpty } from 'class-validator';

export class MulterFileDto {
  @ApiProperty()
  @IsString()
  fieldname: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  originalname: string;

  @ApiProperty()
  @IsString()
  encoding: string;

  @ApiProperty()
  @IsString()
  mimetype: string;

  @ApiProperty()
  @IsObject()
  buffer: Buffer;

  @ApiProperty()
  @IsNumber()
  size: number;
}