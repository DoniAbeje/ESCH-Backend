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
import * as mongoose from 'mongoose';
import { ExamDoesNotExistException } from '../src/exam/exceptions/exam-doesnot-exist.exception';
import { UpdateExamDto } from '../src/exam/dto/update-exam.dto';
import { PaginationOption } from '../src/common/pagination-option';

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

  describe('updateExam', () => {
    it('should reject with unauthenticated user', async () => {
      const id = mongoose.Types.ObjectId();
      await request(app.getHttpServer())
        .put(`${baseUrl}/${id}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should reject with non existing exam', async () => {
      const id = mongoose.Types.ObjectId();
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);

      const { body } = await request(app.getHttpServer())
        .put(`${baseUrl}/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.NOT_FOUND);

      expect(body.exception).toEqual(ExamDoesNotExistException.name);
    });

    it('should update exam successfully', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const exam = await examTestHelper.createTestExam({
        preparedBy: user._id,
      });
      const sampleQuestion = mongoose.Types.ObjectId().toHexString();
      const updateExamDto: UpdateExamDto = {
        title: 'new title',
        description: 'new description',
        tags: ['new tag'],
        price: 10,
        samples: [sampleQuestion],
      };

      await request(app.getHttpServer())
        .put(`${baseUrl}/${exam._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateExamDto)
        .expect(HttpStatus.OK);

      const updatedExam = await examService.exists(exam._id);
      expect(updatedExam).toMatchObject(expect.objectContaining(updateExamDto));
    });
  });

  describe('fetchAllExams', () => {
    it('should return exams with default pagination', async () => {
      const user = await userTestHelper.createTestUser();
      const exams = await examTestHelper.createTestExams(
        PaginationOption.DEFAULT_LIMIT * 2,
        { preparedBy: user._id },
      );

      const { body } = await request(app.getHttpServer())
        .get(baseUrl)
        .expect(HttpStatus.OK);
      const expectedResponse = examTestHelper.getResponse(
        exams.filter((_, index) => index < PaginationOption.DEFAULT_LIMIT),
        user,
      );
      expect(body).toEqual(expectedResponse);
    });

    it('should return exams with given limit and offset', async () => {
      const user = await userTestHelper.createTestUser();
      const exams = await examTestHelper.createTestExams(
        PaginationOption.DEFAULT_LIMIT,
        { preparedBy: user._id },
      );

      const { body } = await request(app.getHttpServer())
        .get(`${baseUrl}?limit=5&offset=5`)
        .expect(HttpStatus.OK);
      const expectedResponse = examTestHelper.getResponse(
        exams.filter((_, index) => index >= 5 && index < 10),
        user,
      );
      expect(body).toEqual(expectedResponse);
    });

    it('should return exams filtered by tags', async () => {
      const user = await userTestHelper.createTestUser();
      const mathEasyExams = await examTestHelper.createTestExams(10, {
        preparedBy: user._id,
        tags: ['math', '11th', 'easy'],
      });

      const mathHardExams = await examTestHelper.createTestExams(10, {
        preparedBy: user._id,
        tags: ['math', '11th', 'hard'],
      });

      const physicsexams = await examTestHelper.createTestExams(10, {
        preparedBy: user._id,
        tags: ['physics', '11th'],
      });

      const { body } = await request(app.getHttpServer())
        .get(`${baseUrl}?tags=math&tags=11th&limit=25`)
        .expect(HttpStatus.OK);

      const expectedResponse = examTestHelper.getResponse(
        [...mathEasyExams, ...mathHardExams],
        user,
      );

      expect(body).toEqual(expectedResponse);
    });
  });
});
