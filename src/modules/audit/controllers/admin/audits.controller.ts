import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuditsService } from '../../services/audits.service';
import { ParseFilterPipe } from '../../../core/pipes/parse-filter.pipe';
import { ObjectPipe } from '../../../core/transformers/parse-object.pipe';
import { AuditLog } from '../../entities/audit-log.entity';
import { TokenGuard } from '../../../permissions/guards/token.guard';
import { Roles } from '../../../permissions/decorators/roles.decorator';
import { RolesGuard } from '../../../permissions/guards/roles.guard';
import { AppRole } from '../../../permissions/constants/roles.constants';

@UseGuards(TokenGuard, RolesGuard)
@Controller('admin/audits')
export class AuditsController {
  constructor(private readonly auditsService: AuditsService) {}

  @Get()
  @Roles(AppRole.AUDIT_LIST)
  findAll(
    @Query('take', new DefaultValuePipe(30), new ParseIntPipe()) take: number,
    @Query('skip', new DefaultValuePipe(0), new ParseIntPipe()) skip: number,
    @Query('filter', ParseFilterPipe) filter?: Record<string, string>,
  ) {
    return this.auditsService.findAll(take, skip, filter);
  }

  @Get(':id')
  @Roles(AppRole.AUDIT_DETAILS)
  findOne(@Param('id', ObjectPipe(AuditLog, ['user'])) auditLog: AuditLog) {
    return auditLog;
  }
}
