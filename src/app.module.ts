import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LibrosModule } from './libros/libros.module';
import { ProgramasModule } from './programas/programas.module';
import { GruposModule } from './grupos/grupos.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USER || 'lectura_user',
      password: process.env.DATABASE_PASSWORD || 'lectura_password',
      database: process.env.DATABASE_NAME || 'book_journal',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
    }),
    AuthModule,
    UsersModule,
    LibrosModule,
    ProgramasModule,
    GruposModule,
  ],
})
export class AppModule {}
