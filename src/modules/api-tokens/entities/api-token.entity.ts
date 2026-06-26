import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Environment } from '../../environments/entities/environment.entity';
import { User } from '../../permissions/entities/user.entity';

@Entity('api_tokens')
export class ApiToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  @Exclude()
  tokenHash: string;

  @Column({ type: 'text', nullable: true })
  @Exclude()
  encryptedToken?: string;

  @ManyToOne(() => Environment, { nullable: false, eager: true })
  @JoinColumn({ name: 'environmentId' })
  environment: Environment;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => User, { nullable: false, eager: false })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
