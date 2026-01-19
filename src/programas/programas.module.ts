import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramasService } from './programas.service';
import { ProgramasController } from './programas.controller';
import { ProgramaLectura } from './entities/programa-lectura.entity';
import { GruposModule } from '../grupos/grupos.module';

@Module({
  imports: [TypeOrmModule.forFeature([ProgramaLectura]), GruposModule],
  controllers: [ProgramasController],
  providers: [ProgramasService],
  exports: [ProgramasService],
})
export class ProgramasModule {}
