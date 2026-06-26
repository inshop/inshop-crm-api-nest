import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeatureFlagsService } from './services/feature-flags.service';
import { FeatureFlagsController } from './controllers/admin/feature-flags.controller';
import { FeatureFlagsClientController } from './controllers/client/feature-flags-client.controller';
import { FeatureFlag } from './entities/feature-flag.entity';
import { FeatureFlagEnvironmentValue } from './entities/feature-flag-environment-value.entity';
import { Project } from '../projects/entities/project.entity';
import { Environment } from '../environments/entities/environment.entity';
import { PermissionsModule } from '../permissions/permissions.module';
import { ApiTokensModule } from '../api-tokens/api-tokens.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FeatureFlag,
      FeatureFlagEnvironmentValue,
      Project,
      Environment,
    ]),
    PermissionsModule,
    ApiTokensModule,
  ],
  controllers: [FeatureFlagsController, FeatureFlagsClientController],
  providers: [FeatureFlagsService],
})
export class FeatureFlagsModule {}
