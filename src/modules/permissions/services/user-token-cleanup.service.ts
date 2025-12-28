import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserTokenService } from './user-token.service';

@Injectable()
export class UserTokenCleanupService {
  private readonly logger = new Logger(UserTokenCleanupService.name);

  constructor(private readonly userTokenService: UserTokenService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    this.logger.debug('Running daily cleanup of expired tokens');

    try {
      await this.userTokenService.cleanupExpiredTokens();
      this.logger.debug('Expired tokens cleanup finished');
    } catch (err) {
      this.logger.error(err);
    }
  }
}
