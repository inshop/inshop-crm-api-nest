import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import config from './config/config';
import { ProjectsModule } from './modules/projects/projects.module';
import { EnvironmentsModule } from './modules/environments/environments.module';
import { FeatureFlagsModule } from './modules/feature-flags/feature-flags.module';
import { ApiTokensModule } from './modules/api-tokens/api-tokens.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { AuditModule } from './modules/audit/audit.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as process from 'node:process';
import { IsUniqueConstraint } from './modules/core/validators/is-unique.decorator';
import { ExistsConstraint } from './modules/core/validators/exists.decorator';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    AuditModule,
    ProjectsModule,
    EnvironmentsModule,
    FeatureFlagsModule,
    ApiTokensModule,
    PermissionsModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: process.env.DATABASE_TYPE as 'mysql' | 'postgres',
      host: process.env.DATABASE_HOST,
      port: +(process.env.DATABASE_PORT as string),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      synchronize: !!process.env.DATABASE_SYNCHRONIZE,
      autoLoadEntities: true,
    }),
    JwtModule.register({
      global: true,
      secret: config().jwtSecret,
      signOptions: { expiresIn: '3600s' },
    }),
  ],
  controllers: [],
  providers: [IsUniqueConstraint, ExistsConstraint],
})
export class AppModule {}
