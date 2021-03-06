import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { configApp } from '../src/utils/config-app';
import { UserTestHelperService } from '../src/user/test-helper.service';
import { CreateUserDto } from '../src/user/dto/create-user.dto';
import { PhoneTakenException } from '../src/user/exceptions/phone-taken.exception';
import { UserService } from '../src/user/user.service';
import { LoginDto } from '../src/user/dto/login.dto';
import { AuthService } from '../src/auth/auth.service';
import { UpdateUserDto } from '../src/user/dto/update-user.dto';
import { UserDoesNotExistException } from '../src/user/exceptions/user-doesnot-exist.exception';
import * as mongoose from 'mongoose';
import { UserRole } from '../src/user/schemas/user.schema';

describe('User Module (e2e)', () => {
  let app: INestApplication;
  let userTestHelper: UserTestHelperService;
  let userService: UserService;
  let authService: AuthService;
  const baseUrl = '/users';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    userTestHelper = moduleFixture.get<UserTestHelperService>(
      UserTestHelperService,
    );
    authService = moduleFixture.get<AuthService>(AuthService);
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
      const createUserDto: CreateUserDto =
        userTestHelper.generateCreateUserDto();

      const { body } = await request(app.getHttpServer())
        .post(baseUrl)
        .send(createUserDto)
        .expect(HttpStatus.BAD_REQUEST);

      expect(body.exception).toEqual(PhoneTakenException.name);
    });

    it('should create new user', async () => {
      const createUserDto: CreateUserDto =
        userTestHelper.generateCreateUserDto();

      const { body } = await request(app.getHttpServer())
        .post(baseUrl)
        .send(createUserDto)
        .expect(HttpStatus.CREATED);

      expect(body).toEqual({
        token: expect.any(String),
        accountInfo: {
          _id: expect.any(String),
          firstName: createUserDto.firstName,
          lastName: createUserDto.lastName,
          phone: createUserDto.phone,
          profilePicture: createUserDto.profilePicture,
          role: createUserDto.role,
        },
      });

      const savedUser = await userService.exists(body.accountInfo._id);
      const { firstName, lastName, phone, profilePicture } = createUserDto;
      const expectedSavedData = { firstName, lastName, phone, profilePicture };

      expect(savedUser).toMatchObject(
        expect.objectContaining(expectedSavedData),
      );
    });
  });

  describe('login', () => {
    it('should reject with wrong credentials', async () => {
      const loginDto: LoginDto = {
        phone: '0912345678',
        password: 'wrong-password',
      };
      await request(app.getHttpServer())
        .post(`${baseUrl}/login`)
        .send(loginDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should login successfully', async () => {
      const createUserDto: CreateUserDto =
        userTestHelper.generateCreateUserDto();
      await userTestHelper.createTestUser(createUserDto);
      const loginDto: LoginDto = {
        phone: createUserDto.phone,
        password: createUserDto.password,
      };
      await request(app.getHttpServer())
        .post(`${baseUrl}/login`)
        .send(loginDto)
        .expect(HttpStatus.CREATED);
    });
  });

  describe('updateUser', () => {
    it('should reject with unauthenticated user', async () => {
      await request(app.getHttpServer())
        .put(baseUrl)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should update user info successfully', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const updateUserDto: UpdateUserDto = {
        firstName: 'updated first name',
        lastName: 'updated last name',
        profilePicture: 'https://images.unsplash.com/no-image.jpg',
      };

      await request(app.getHttpServer())
        .put(baseUrl)
        .set('Authorization', `Bearer ${token}`)
        .send(updateUserDto)
        .expect(HttpStatus.OK);

      const updatedUser = await userService.exists(user._id);
      expect(updatedUser).toMatchObject(expect.objectContaining(updateUserDto));
    });
  });

  describe('fetchSingleUser', () => {
    it('should reject with non existing user id', async () => {
      const userId = new mongoose.Types.ObjectId();
      const { body } = await request(app.getHttpServer())
        .get(`${baseUrl}/${userId}`)
        .expect(HttpStatus.NOT_FOUND);

      expect(body.exception).toBe(UserDoesNotExistException.name);
    });

    it('should return user details', async () => {
      const user = await userTestHelper.createTestUser();

      const { body } = await request(app.getHttpServer())
        .get(`${baseUrl}/${user._id}`)
        .expect(HttpStatus.OK);
      expect(body).toMatchObject({
        _id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        profilePicture: user.profilePicture,
      });
    });
  });
});
