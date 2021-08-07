import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { configApp } from '../src/utils/config-app';
import { TestHelperService } from '../src/common/services/test-helper.service';
import { CreateUserDto } from '../src/user/dto/create-user.dto';
import { PhoneTakenException } from '../src/user/exceptions/phone-taken.exception';

describe('User Module (e2e)', () => {
  let app: INestApplication;
  let helper: TestHelperService;
  const baseUrl = '/users';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    helper = moduleFixture.get<TestHelperService>(TestHelperService);
    configApp(app);

    await app.init();
  });

  beforeEach(async () => {
    await helper.clearUsersData();
  })

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

    it(`should reject with ${PhoneTakenException.name}`, async () => {
      await helper.createTestUser();
      const createUserDto: CreateUserDto = helper.generateCreateUserDto();

      const { body } = await request(app.getHttpServer())
        .post(baseUrl)
        .send(createUserDto)
        .expect(HttpStatus.BAD_REQUEST);

      expect(body.exception).toEqual(PhoneTakenException.name);
    });
  });
});
