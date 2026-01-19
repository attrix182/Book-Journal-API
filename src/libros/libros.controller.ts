import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { LibrosService } from './libros.service';
import { CreateLibroDto } from './dto/create-libro.dto';
import { UpdateLibroDto } from './dto/update-libro.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('libros')
@UseGuards(JwtAuthGuard)
export class LibrosController {
  constructor(private readonly librosService: LibrosService) {}

  @Post()
  create(@Body() createLibroDto: CreateLibroDto, @Request() req) {
    return this.librosService.create(createLibroDto, req.user.id);
  }

  @Get()
  findAll(@Request() req) {
    return this.librosService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.librosService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateLibroDto: UpdateLibroDto,
    @Request() req,
  ) {
    return this.librosService.update(id, updateLibroDto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.librosService.remove(id, req.user.id);
  }
}
