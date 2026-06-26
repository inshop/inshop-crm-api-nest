import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Environment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  code: string;

  @Column({ default: true })
  isActive: boolean;
}
