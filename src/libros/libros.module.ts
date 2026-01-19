import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LibrosService } from './libros.service';
import { LibrosController } from './libros.controller';
import { Libro } from './entities/libro.entity';
import { ProgramasModule } from '../programas/programas.module';

@Module({
  imports: [TypeOrmModule.forFeature([Libro]), ProgramasModule],
  controllers: [LibrosController],
  providers: [LibrosService],
  exports: [LibrosService],
})
export class LibrosModule {}
