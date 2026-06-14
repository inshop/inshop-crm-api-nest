import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { User } from '../../permissions/entities/user.entity';
import {
  AuditAction,
  AuditEntityType,
} from '../constants/audit.constants';
import {
  computeAuditDiff,
  sanitizeForAudit,
} from '../../core/utils/audit-sanitize';

export type AuditMetadata = {
  ip?: string;
  userAgent?: string;
};

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  private async save(
    action: AuditAction,
    entityType: string,
    actor: User,
    entityId?: number,
    changes?: Record<string, unknown>,
    metadata?: AuditMetadata,
  ): Promise<void> {
    const entry = this.auditLogRepository.create({
      action,
      entityType,
      entityId,
      user: actor,
      changes,
      metadata,
    });

    await this.auditLogRepository.save(entry);
  }

  async logCreate(
    actor: User,
    entityType: string,
    entityId: number,
    data: Record<string, unknown>,
  ): Promise<void> {
    await this.save(
      AuditAction.CREATE,
      entityType,
      actor,
      entityId,
      sanitizeForAudit(data),
    );
  }

  async logCreateIf(
    actor: User | undefined,
    entityType: string,
    entityId: number,
    data: Record<string, unknown>,
  ): Promise<void> {
    if (actor) {
      await this.logCreate(actor, entityType, entityId, data);
    }
  }

  async logUpdate(
    actor: User,
    entityType: string,
    entityId: number,
    before: Record<string, unknown>,
    after: Record<string, unknown>,
  ): Promise<void> {
    const diff = computeAuditDiff(before, after);

    if (Object.keys(diff).length === 0) {
      return;
    }

    await this.save(AuditAction.UPDATE, entityType, actor, entityId, diff);
  }

  async logUpdateIf(
    actor: User | undefined,
    entityType: string,
    entityId: number,
    before: Record<string, unknown> | undefined,
    after: Record<string, unknown>,
  ): Promise<void> {
    if (actor && before) {
      await this.logUpdate(actor, entityType, entityId, before, after);
    }
  }

  async logDelete(
    actor: User,
    entityType: string,
    entityId: number,
    snapshot: Record<string, unknown>,
  ): Promise<void> {
    await this.save(
      AuditAction.DELETE,
      entityType,
      actor,
      entityId,
      sanitizeForAudit(snapshot),
    );
  }

  async logDeleteIf(
    actor: User | undefined,
    entityType: string,
    entityId: number,
    snapshot?: Record<string, unknown>,
  ): Promise<void> {
    if (actor && snapshot) {
      await this.logDelete(actor, entityType, entityId, snapshot);
    }
  }

  async logLogin(user: User, metadata?: AuditMetadata): Promise<void> {
    await this.logAuth(AuditAction.LOGIN, user, metadata);
  }

  async logLogout(user: User, metadata?: AuditMetadata): Promise<void> {
    await this.logAuth(AuditAction.LOGOUT, user, metadata);
  }

  private async logAuth(
    action: AuditAction.LOGIN | AuditAction.LOGOUT,
    user: User,
    metadata?: AuditMetadata,
  ): Promise<void> {
    await this.save(
      action,
      AuditEntityType.AUTH,
      user,
      user.id,
      { email: user.email },
      metadata,
    );
  }
}
