import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new UnauthorizedException('El email ya está registrado');
    }

    const user = await this.usersService.create(
      registerDto.email,
      registerDto.password,
      registerDto.nombre,
    );

    const { password, ...result } = user;
    return {
      user: result,
      access_token: this.jwtService.sign({ id: user.id, email: user.email }),
    };
  }

  async login(loginDto: { email: string; password?: string }) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const { password, ...result } = user;
    return {
      user: result,
      access_token: this.jwtService.sign({ id: user.id, email: user.email }),
    };
  }

  async validateUser(userId: string) {
    return this.usersService.findById(userId);
  }
}
