import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { configApp } from '../src/utils/config-app';
import { UserTestHelperService } from '../src/user/test-helper.service';
import { CreateUserDto } from '../src/user/dto/create-user.dto';
import { PhoneTakenException } from '../src/user/exceptions/phone-taken.exception';
import { UserService } from '../src/user/user.service';

describe('User Module (e2e)', () => {
  let app: INestApplication;
  let userTestHelper: UserTestHelperService;
  let userService: UserService;
  const baseUrl = '/users';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    userTestHelper = moduleFixture.get<UserTestHelperService>(UserTestHelperService);
    userService = moduleFixture.get<UserService>(UserService);
    configApp(app);

    await app.init();
  });

  beforeEach(async () => {
    await userTestHelper.clearUsersData();
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

    it(`should reject with ${PhoneTakenException.name}`, async () => {
      await userTestHelper.createTestUser();
      const createUserDto: CreateUserDto = userTestHelper.generateCreateUserDto();

      const { body } = await request(app.getHttpServer())
        .post(baseUrl)
        .send(createUserDto)
        .expect(HttpStatus.BAD_REQUEST);

      expect(body.exception).toEqual(PhoneTakenException.name);
    });

    it('should create new user', async () => {
      const createUserDto: CreateUserDto = userTestHelper.generateCreateUserDto();

      const { body } = await request(app.getHttpServer())
        .post(baseUrl)
        .send(createUserDto)
        .expect(HttpStatus.CREATED);

      expect(body).toEqual({
        token: expect.any(String),
        userInfo: {
          _id: expect.any(String),
          firstName: createUserDto.firstName,
          lastName: createUserDto.lastName,
          phone: createUserDto.phone,
        },
      });

      const savedUser = await userService.exists(body.userInfo._id);
      const { firstName, lastName, phone, profilePicture } = createUserDto;
      const expectedSavedData = { firstName, lastName, phone, profilePicture };

      expect(savedUser).toMatchObject(
        expect.objectContaining(expectedSavedData),
      );
    });
  });
});
