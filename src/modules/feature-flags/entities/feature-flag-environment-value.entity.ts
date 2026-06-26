import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { FeatureFlag } from './feature-flag.entity';
import { Environment } from '../../environments/entities/environment.entity';

@Entity()
@Unique(['featureFlag', 'environment'])
export class FeatureFlagEnvironmentValue {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => FeatureFlag, (flag) => flag.environmentValues, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  featureFlag: FeatureFlag;

  @ManyToOne(() => Environment, { nullable: false, eager: true })
  environment: Environment;

  @Column({ default: false })
  enabled: boolean;
}
