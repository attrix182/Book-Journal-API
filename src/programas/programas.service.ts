import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgramaLectura } from './entities/programa-lectura.entity';
import { CreateProgramaDto } from './dto/create-programa.dto';
import { LibrosService } from '../libros/libros.service';

@Injectable()
export class ProgramasService {
  constructor(
    @InjectRepository(ProgramaLectura)
    private programasRepository: Repository<ProgramaLectura>,
    private librosService: LibrosService,
  ) {}

  async create(
    createProgramaDto: CreateProgramaDto,
    userId: string,
  ): Promise<ProgramaLectura> {
    // Verificar que el libro pertenece al usuario
    await this.librosService.findOne(createProgramaDto.libroId, userId);

    const programa = this.programasRepository.create(createProgramaDto);
    return this.programasRepository.save(programa);
  }

  async findByLibroId(libroId: string, userId: string): Promise<ProgramaLectura | null> {
    // Verificar que el libro pertenece al usuario
    await this.librosService.findOne(libroId, userId);

    return this.programasRepository.findOne({
      where: { libroId },
      relations: ['grupos'],
    });
  }

  async findOne(id: string, userId: string): Promise<ProgramaLectura> {
    const programa = await this.programasRepository.findOne({
      where: { id },
      relations: ['libro', 'grupos'],
    });

    if (!programa) {
      throw new NotFoundException(`Programa con ID ${id} no encontrado`);
    }

    // Verificar que el libro pertenece al usuario
    await this.librosService.findOne(programa.libroId, userId);

    return programa;
  }

  async remove(id: string, userId: string): Promise<void> {
    const programa = await this.findOne(id, userId);
    await this.programasRepository.remove(programa);
  }
}
