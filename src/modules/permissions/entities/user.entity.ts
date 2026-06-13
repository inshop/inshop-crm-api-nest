import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Group } from './group.entity';
import { Exclude } from 'class-transformer';
import { hashPassword, isBcryptHash } from '../../core/utils/password';

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
  @BeforeUpdate()
  generatePasswordHash(): void {
    if (this.password && !isBcryptHash(this.password)) {
      this.password = hashPassword(this.password);
    }
  }

  roles(): string[] {
    return this.group.roles.map((role) => role.role);
  }
}
