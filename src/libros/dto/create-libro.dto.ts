import { IsString, IsOptional, IsNumber, IsEnum, IsDateString } from 'class-validator';

export class CreateLibroDto {
  @IsString()
  titulo: string;

  @IsOptional()
  @IsString()
  autor?: string;

  @IsOptional()
  @IsNumber()
  totalCapitulos?: number;

  @IsOptional()
  @IsNumber()
  totalPaginas?: number;

  @IsEnum(['capitulos', 'paginas'])
  tipoLectura: 'capitulos' | 'paginas';

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;
}
