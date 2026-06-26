import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiToken } from './entities/api-token.entity';
import { Environment } from '../environments/entities/environment.entity';
import { ApiTokensService } from './services/api-tokens.service';
import { ApiTokensController } from './controllers/admin/api-tokens.controller';
import { ApiTokenGuard } from './guards/api-token.guard';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApiToken, Environment]),
    PermissionsModule,
  ],
  controllers: [ApiTokensController],
  providers: [ApiTokensService, ApiTokenGuard],
  exports: [ApiTokensService, ApiTokenGuard],
})
export class ApiTokensModule {}
