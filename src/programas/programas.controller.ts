import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProgramasService } from './programas.service';
import { CreateProgramaDto } from './dto/create-programa.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('programas')
@UseGuards(JwtAuthGuard)
export class ProgramasController {
  constructor(private readonly programasService: ProgramasService) {}

  @Post()
  create(@Body() createProgramaDto: CreateProgramaDto, @Request() req) {
    return this.programasService.create(createProgramaDto, req.user.id);
  }

  @Get('libro/:libroId')
  findByLibroId(@Param('libroId') libroId: string, @Request() req) {
    return this.programasService.findByLibroId(libroId, req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.programasService.findOne(id, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.programasService.remove(id, req.user.id);
  }
}
