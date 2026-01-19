import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GruposService } from './grupos.service';
import { GruposController } from './grupos.controller';
import { GrupoLectura } from './entities/grupo-lectura.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GrupoLectura])],
  controllers: [GruposController],
  providers: [GruposService],
  exports: [GruposService],
})
export class GruposModule {}
