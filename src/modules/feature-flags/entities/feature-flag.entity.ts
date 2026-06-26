import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../permissions/entities/user.entity';
import { Project } from '../../projects/entities/project.entity';
import { FeatureFlagEnvironmentValue } from './feature-flag-environment-value.entity';

@Entity()
export class FeatureFlag {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  code: string;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @ManyToOne(() => User, { nullable: false, eager: false })
  createdBy: User;

  @ManyToMany(() => Project, { eager: false })
  @JoinTable({ name: 'feature_flags_projects' })
  projects: Project[];

  @OneToMany(
    () => FeatureFlagEnvironmentValue,
    (value) => value.featureFlag,
    { cascade: true },
  )
  environmentValues: FeatureFlagEnvironmentValue[];
}
