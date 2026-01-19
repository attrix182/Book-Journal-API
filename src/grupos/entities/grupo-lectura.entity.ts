import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProgramaLectura } from '../../programas/entities/programa-lectura.entity';

@Entity('grupos_lectura')
export class GrupoLectura {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ProgramaLectura, (programa) => programa.grupos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'programaId' })
  programa: ProgramaLectura;

  @Column()
  programaId: string;

  @Column()
  rango: string; // ej: "1-3", "12-15", "Génesis 1-3"

  @Column({ type: 'date', nullable: true })
  fechaProgramada: Date;

  @Column({ type: 'date', nullable: true })
  fechaCompletada: Date;

  @Column({ default: false })
  completado: boolean;

  @Column({
    type: 'enum',
    enum: ['rombo-rojo', 'punto-azul'],
    nullable: true,
  })
  marcadorEspecial: 'rombo-rojo' | 'punto-azul';

  @Column({ type: 'text', nullable: true })
  notas: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
