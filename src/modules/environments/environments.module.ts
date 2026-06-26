import { Module } from '@nestjs/common';
import { EnvironmentsService } from './services/environments.service';
import { EnvironmentsController } from './controllers/admin/environments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Environment } from './entities/environment.entity';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [TypeOrmModule.forFeature([Environment]), PermissionsModule],
  controllers: [EnvironmentsController],
  providers: [EnvironmentsService],
})
export class EnvironmentsModule {}
