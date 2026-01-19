import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsEnum,
} from 'class-validator';

export class CreateGrupoDto {
  @IsString()
  rango: string;

  @IsOptional()
  @IsDateString()
  fechaProgramada?: string;

  @IsOptional()
  @IsDateString()
  fechaCompletada?: string;

  @IsOptional()
  @IsBoolean()
  completado?: boolean;

  @IsOptional()
  @IsEnum(['rombo-rojo', 'punto-azul'])
  marcadorEspecial?: 'rombo-rojo' | 'punto-azul';

  @IsOptional()
  @IsString()
  notas?: string;
}
