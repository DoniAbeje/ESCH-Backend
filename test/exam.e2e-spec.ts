import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { configApp } from '../src/utils/config-app';
import * as request from 'supertest';
import { UserTestHelperService } from '../src/user/test-helper.service';
import { AuthService } from '../src/auth/auth.service';
import { CreateExamDto } from '../src/exam/dto/create-exam.dto';
import { ExamTestHelperService } from '../src/exam/test-helper.service';
import { ExamService } from '../src/exam/exam.service';
import { toJSON } from '../src/utils/utils';

describe('Exam Module (e2e)', () => {
  let app: INestApplication;
  let userTestHelper: UserTestHelperService;
  let examTestHelper: ExamTestHelperService;
  let authService: AuthService;
  let examService: ExamService;
  const baseUrl = '/exam';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    userTestHelper = moduleFixture.get<UserTestHelperService>(
      UserTestHelperService,
    );
    authService = moduleFixture.get<AuthService>(AuthService);
    examService = moduleFixture.get<ExamService>(ExamService);
    examTestHelper = moduleFixture.get<ExamTestHelperService>(
      ExamTestHelperService,
    );

    configApp(app);

    await app.init();
  });

  beforeEach(async () => {
    await userTestHelper.clearUsersData();
    await examTestHelper.clearExams();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('createExam', () => {
    it('should reject with unauthenticated user', async () => {
      await request(app.getHttpServer())
        .post(baseUrl)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should reject with validation error', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const expectedMessage = [
        'title must be a string',
        'description must be a string',
        'tags must contain at least 1 elements',
      ];

      const { body } = await request(app.getHttpServer())
        .post(baseUrl)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.BAD_REQUEST);

      expect(body.message).toEqual(expectedMessage);
    });

    it('should create exam successfully', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const createExamDto: CreateExamDto =
        examTestHelper.generateCreateExamDto();

      const { body } = await request(app.getHttpServer())
        .post(baseUrl)
        .set('Authorization', `Bearer ${token}`)
        .send(createExamDto)
        .expect(HttpStatus.CREATED);

      expect(body).toEqual({ _id: expect.any(String) });

      const savedExam = await examService.exists(body._id);
      createExamDto.preparedBy = toJSON(user)._id;

      expect(toJSON(savedExam)).toMatchObject(
        expect.objectContaining(createExamDto),
      );
    });
  });
});
