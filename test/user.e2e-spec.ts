import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { configApp } from '../src/utils/config-app';
import { validate } from 'class-validator';
import { CreateUserDto } from '../src/user/dto/create-user.dto';

describe('User Module (e2e)', () => {
  let app: INestApplication;
  const baseUrl = '/users';

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configApp(app);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('createUser', () => {
    it('should reject with validation error', async () => {
      const expectedMessage = [
        'firstName must be a string',
        'lastName must be a string',
        'phone must be in the format 09xxxxxxxx',
        'password must be longer than or equal to 8 characters',
      ];

      const { body } = await request(app.getHttpServer())
        .post(baseUrl)
        .expect(HttpStatus.BAD_REQUEST);

      expect(body.message).toEqual(expectedMessage);
    });
  });
});
