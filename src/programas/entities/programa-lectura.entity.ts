import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Libro } from '../../libros/entities/libro.entity';
import { GrupoLectura } from '../../grupos/entities/grupo-lectura.entity';

@Entity('programas_lectura')
export class ProgramaLectura {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Libro, (libro) => libro.programa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'libroId' })
  libro: Libro;

  @Column()
  libroId: string;

  @OneToMany(() => GrupoLectura, (grupo) => grupo.programa, { cascade: true })
  grupos: GrupoLectura[];

  @CreateDateColumn()
  fechaCreacion: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
