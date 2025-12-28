import {
  BeforeInsert,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Group } from './group.entity';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Group, { nullable: false, eager: false })
  group: Group;

  @BeforeInsert()
  generatePasswordHash(): void {
    const saltOrRounds = 10;
    this.password = bcrypt.hashSync(this.password, saltOrRounds);
  }

  roles(): string[] {
    return this.group.roles.map((role) => role.role);
  }
}
