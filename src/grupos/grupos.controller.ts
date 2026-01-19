import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { GruposService } from './grupos.service';
import { UpdateGrupoDto } from './dto/update-grupo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('grupos')
@UseGuards(JwtAuthGuard)
export class GruposController {
  constructor(private readonly gruposService: GruposService) {}

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.gruposService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateGrupoDto: UpdateGrupoDto,
    @Request() req,
  ) {
    return this.gruposService.update(id, updateGrupoDto, req.user.id);
  }
}
