import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Libro } from './entities/libro.entity';
import { CreateLibroDto } from './dto/create-libro.dto';
import { UpdateLibroDto } from './dto/update-libro.dto';

@Injectable()
export class LibrosService {
  constructor(
    @InjectRepository(Libro)
    private librosRepository: Repository<Libro>,
  ) {}

  async create(createLibroDto: CreateLibroDto, userId: string): Promise<Libro> {
    const libro = this.librosRepository.create({
      ...createLibroDto,
      userId,
    });
    return this.librosRepository.save(libro);
  }

  async findAll(userId: string): Promise<Libro[]> {
    return this.librosRepository.find({
      where: { userId },
      relations: ['programa'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Libro> {
    const libro = await this.librosRepository.findOne({
      where: { id, userId },
      relations: ['programa'],
    });
    if (!libro) {
      throw new NotFoundException(`Libro con ID ${id} no encontrado`);
    }
    return libro;
  }

  async update(
    id: string,
    updateLibroDto: UpdateLibroDto,
    userId: string,
  ): Promise<Libro> {
    const libro = await this.findOne(id, userId);
    Object.assign(libro, updateLibroDto);
    return this.librosRepository.save(libro);
  }

  async remove(id: string, userId: string): Promise<void> {
    const libro = await this.findOne(id, userId);
    await this.librosRepository.remove(libro);
  }
}
