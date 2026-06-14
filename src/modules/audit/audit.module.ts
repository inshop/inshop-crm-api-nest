import { forwardRef, Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { AuditService } from './services/audit.service';
import { AuditsService } from './services/audits.service';
import { AuditsController } from './controllers/admin/audits.controller';
import { PermissionsModule } from '../permissions/permissions.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLog]),
    forwardRef(() => PermissionsModule),
  ],
  controllers: [AuditsController],
  providers: [AuditService, AuditsService],
  exports: [AuditService],
})
export class AuditModule {}
