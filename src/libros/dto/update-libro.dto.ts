import { IsString, IsOptional, IsNumber, IsEnum, IsDateString } from 'class-validator';

export class UpdateLibroDto {
  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  autor?: string;

  @IsOptional()
  @IsNumber()
  totalCapitulos?: number;

  @IsOptional()
  @IsNumber()
  totalPaginas?: number;

  @IsOptional()
  @IsEnum(['capitulos', 'paginas'])
  tipoLectura?: 'capitulos' | 'paginas';

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;
}
