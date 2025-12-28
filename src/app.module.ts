import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import config from './config/config';
import { ClientsModule } from './modules/clients/clients.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as process from 'node:process';
import { IsUniqueConstraint } from './modules/core/validators/is-unique.decorator';
import { IdPipe } from './modules/core/transformers/id.pipe';
import { ExistsConstraint } from './modules/core/validators/exists.decorator';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ClientsModule,
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
  providers: [IsUniqueConstraint, ExistsConstraint, IdPipe],
})
export class AppModule {}
