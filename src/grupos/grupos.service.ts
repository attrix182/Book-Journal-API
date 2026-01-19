import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GrupoLectura } from './entities/grupo-lectura.entity';
import { UpdateGrupoDto } from './dto/update-grupo.dto';
import { ProgramasService } from '../programas/programas.service';

@Injectable()
export class GruposService {
  constructor(
    @InjectRepository(GrupoLectura)
    private gruposRepository: Repository<GrupoLectura>,
    private programasService: ProgramasService,
  ) {}

  async findOne(id: string, userId: string): Promise<GrupoLectura> {
    const grupo = await this.gruposRepository.findOne({
      where: { id },
      relations: ['programa', 'programa.libro'],
    });

    if (!grupo) {
      throw new NotFoundException(`Grupo con ID ${id} no encontrado`);
    }

    // Verificar que el programa pertenece al usuario
    await this.programasService.findOne(grupo.programaId, userId);

    return grupo;
  }

  async update(
    id: string,
    updateGrupoDto: UpdateGrupoDto,
    userId: string,
  ): Promise<GrupoLectura> {
    const grupo = await this.findOne(id, userId);
    Object.assign(grupo, updateGrupoDto);
    
    // Si se marca como completado y no tiene fecha, establecer fecha actual
    if (updateGrupoDto.completado && !grupo.fechaCompletada) {
      grupo.fechaCompletada = new Date();
    }
    
    return this.gruposRepository.save(grupo);
  }

  async remove(id: string, userId: string): Promise<void> {
    const grupo = await this.findOne(id, userId);
    await this.gruposRepository.remove(grupo);
  }
}
