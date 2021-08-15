import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { QaTestHelperService } from '../src/qa/test-helper.service';
import { configApp } from '../src/utils/config-app';
import * as request from 'supertest';
import { UserTestHelperService } from '../src/user/test-helper.service';
import { AuthService } from '../src/auth/auth.service';
import { RaiseQuestionDto } from '../src/qa/dto/raise-question.dto';
import { QuestionService } from '../src/qa/question.service';
import { toJSON } from '../src/utils/utils';
import { PaginationOption } from '../src/common/pagination-option';
import * as mongoose from 'mongoose';
import { identity } from 'rxjs';
import { QuestionDoesNotExistException } from '../src/qa/exceptions/question-doesnot-exist.exception';

describe('QA Module (e2e)', () => {
  let app: INestApplication;
  let qaTestHelper: QaTestHelperService;
  let userTestHelper: UserTestHelperService;
  let authService: AuthService;
  let questionService: QuestionService;
  const baseUrl = '/question';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    qaTestHelper = moduleFixture.get<QaTestHelperService>(QaTestHelperService);
    userTestHelper = moduleFixture.get<UserTestHelperService>(
      UserTestHelperService,
    );
    authService = moduleFixture.get<AuthService>(AuthService);
    questionService = moduleFixture.get<QuestionService>(QuestionService);
    configApp(app);

    await app.init();
  });

  beforeEach(async () => {
    await qaTestHelper.clearAnswers();
    await qaTestHelper.clearQuestions();
    await userTestHelper.clearUsersData();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('raiseQuestion', () => {
    it('should reject with unauthenticated user', async () => {
      await request(app.getHttpServer())
        .post(baseUrl)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should reject with input validation', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const expectedMessage = [
        'question must be a string',
        'tags must contain at least 1 elements',
      ];

      const { body } = await request(app.getHttpServer())
        .post(baseUrl)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.BAD_REQUEST);

      expect(body.message).toEqual(expectedMessage);
    });

    it('should create question successfully', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const raiseQuestionDto: RaiseQuestionDto =
        qaTestHelper.generateRaiseQuestionDto();

      const { body } = await request(app.getHttpServer())
        .post(baseUrl)
        .set('Authorization', `Bearer ${token}`)
        .send(raiseQuestionDto)
        .expect(HttpStatus.CREATED);

      expect(body).toEqual({ _id: expect.any(String) });

      const savedQuestion = await questionService.exists(body._id);
      raiseQuestionDto.askedBy = toJSON(user)._id;

      expect(toJSON(savedQuestion)).toMatchObject(
        expect.objectContaining(raiseQuestionDto),
      );
    });
  });

  describe('fetchAllQuestions', () => {
    // without filter
    it('should return all questions', async () => {
      const user = await userTestHelper.createTestUser();
      const questions = await qaTestHelper.createTestQuestions(
        PaginationOption.DEFAULT_LIMIT,
        { askedBy: user._id },
      );

      const { body } = await request(app.getHttpServer())
        .get(baseUrl)
        .expect(HttpStatus.OK);
      const expectedResponse = qaTestHelper.getQuestionResponse(
        questions,
        user,
      );
      expect(body).toEqual(expectedResponse);
    });

    it('should return questions with default pagination', async () => {
      const user = await userTestHelper.createTestUser();
      const questions = await qaTestHelper.createTestQuestions(
        PaginationOption.DEFAULT_LIMIT * 2,
        { askedBy: user._id },
      );

      const { body } = await request(app.getHttpServer())
        .get(baseUrl)
        .expect(HttpStatus.OK);

      const expectedResponse = qaTestHelper.getQuestionResponse(
        questions.filter((_, index) => index < PaginationOption.DEFAULT_LIMIT),
        user,
      );

      expect(body).toEqual(expectedResponse);
    });

    it('should return paginated questions with given limit and offset', async () => {
      const user = await userTestHelper.createTestUser();
      const questions = await qaTestHelper.createTestQuestions(
        PaginationOption.DEFAULT_LIMIT,
        { askedBy: user._id },
      );

      const { body } = await request(app.getHttpServer())
        .get(`${baseUrl}?limit=5&offset=5`)
        .expect(HttpStatus.OK);
      const expectedResponse = qaTestHelper.getQuestionResponse(
        questions.filter((_, index) => index >= 5 && index < 10),
        user,
      );

      expect(body).toEqual(expectedResponse);
    });

    it('should return questions filterd by tags', async () => {
      const user = await userTestHelper.createTestUser();
      const mathEasyQuestions = await qaTestHelper.createTestQuestions(10, {
        askedBy: user._id,
        tags: ['math', '11th', 'easy'],
      });

      const mathHardQuestions = await qaTestHelper.createTestQuestions(10, {
        askedBy: user._id,
        tags: ['math', '11th', 'hard'],
      });

      await qaTestHelper.createTestQuestions(10, {
        askedBy: user._id,
        tags: ['physics', '11th'],
      });

      const { body } = await request(app.getHttpServer())
        .get(`${baseUrl}?tags=math&tags=11th&limit=25`)
        .expect(HttpStatus.OK);

      const expectedResponse = qaTestHelper.getQuestionResponse(
        [...mathEasyQuestions, ...mathHardQuestions],
        user,
      );

      expect(body).toEqual(expectedResponse);
    });
  });

  describe('fetchSingleQuestions', () => {
    // test non existing
    it('should reject with non existing id', async () => {
      const id = mongoose.Types.ObjectId();
      const { body } = await request(app.getHttpServer())
        .get(`${baseUrl}/${id}`)
        .expect(HttpStatus.NOT_FOUND);

      expect(body.exception).toEqual(QuestionDoesNotExistException.name);
    });
    // success
  });
});
