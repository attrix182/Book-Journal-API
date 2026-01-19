import { IsString, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateGrupoDto } from '../../grupos/dto/create-grupo.dto';

export class CreateProgramaDto {
  @IsString()
  libroId: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGrupoDto)
  grupos?: CreateGrupoDto[];
}
