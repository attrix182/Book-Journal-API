import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ProgramaLectura } from '../../programas/entities/programa-lectura.entity';

@Entity('libros')
export class Libro {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  titulo: string;

  @Column({ nullable: true })
  autor: string;

  @Column({ nullable: true })
  totalCapitulos: number;

  @Column({ nullable: true })
  totalPaginas: number;

  @Column({
    type: 'enum',
    enum: ['capitulos', 'paginas'],
  })
  tipoLectura: 'capitulos' | 'paginas';

  @Column({ type: 'date', nullable: true })
  fechaInicio: Date;

  @Column({ type: 'date', nullable: true })
  fechaFin: Date;

  @ManyToOne(() => User, (user) => user.libros)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @OneToOne(() => ProgramaLectura, (programa) => programa.libro, { nullable: true })
  programa: ProgramaLectura;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
