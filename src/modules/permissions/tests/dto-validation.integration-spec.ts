import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { useContainer } from 'class-validator';
import { AppModule } from '../../../app.module';
import { LoginAuthDto } from '../dto/login-auth.dto';
import { CreateUserDto } from '../dto/create-user.dto';
import { RolesSyncService } from '../services/roles-sync.service';
import { truncateAllTables } from '../../../../test/helpers/db-cleanup';
import { DataSource } from 'typeorm';

describe('DTO validation integration', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    useContainer(app.select(AppModule), { fallbackOnErrors: true });
    await app.init();
    dataSource = app.get(DataSource);
    await app.get(RolesSyncService).sync();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await truncateAllTables(dataSource);
    await app.get(RolesSyncService).sync();
  });

  it('rejects invalid LoginAuthDto', async () => {
    const dto = plainToInstance(LoginAuthDto, {
      email: 'not-an-email',
      password: '',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('accepts valid LoginAuthDto', async () => {
    const dto = plainToInstance(LoginAuthDto, {
      email: 'user@example.com',
      password: 'secret',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects CreateUserDto with invalid email', async () => {
    const dto = plainToInstance(CreateUserDto, {
      name: 'User',
      email: 'bad-email',
      password: 'secret',
      group: { id: 1 },
      isActive: true,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
