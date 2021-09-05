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
import { AddExamQuestionDto } from '../src/exam/dto/add-exam-question.dto';
import { ExamQuestionService } from '../src/exam/exam-question.service';
import { QuestionAlreadyAddedException } from '../src/exam/exceptions/question-already-added.exception';
import { DuplicateChoiceValueFoundException } from '../src/exam/exceptions/duplicate-choice-value-found.exception';
import { AnswerKeyNotPartOfChoiceException } from '../src/exam/exceptions/answer-key-not-part-of-choice.exception';
import { ExamQuestionDoesNotExistException } from '../src/exam/exceptions/examQuestion-doesnot-exist.exception';
import { UpdateUserDto } from '../src/user/dto/update-user.dto';
import { UpdateExamQuestionDto } from '../src/exam/dto/update-exam-question.dto';
import { DuplicateChoiceKeyFoundException } from '../src/exam/exceptions/duplicate-choice-key-found.exception';
import { EnrollForExamDto } from '../src/exam/dto/enroll-for-exam.dto';
import { ExamEnrollmentService } from '../src/exam/exam-enrollment.service';
import { QuestionDoesNotBelongToExamException } from '../src/exam/exceptions/question-doesnot-belong-to-exam.exception';
import { NotEnrolledException } from '../src/exam/exceptions/not-enrolled.exception';

describe('Exam Module (e2e)', () => {
  let app: INestApplication;
  let userTestHelper: UserTestHelperService;
  let examTestHelper: ExamTestHelperService;
  let authService: AuthService;
  let examService: ExamService;
  let examQuestionService: ExamQuestionService;
  let examEnrollmentService: ExamEnrollmentService;
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
    examQuestionService =
      moduleFixture.get<ExamQuestionService>(ExamQuestionService);
    examTestHelper = moduleFixture.get<ExamTestHelperService>(
      ExamTestHelperService,
    );
    examEnrollmentService = moduleFixture.get<ExamEnrollmentService>(
      ExamEnrollmentService,
    );

    configApp(app);

    await app.init();
  });

  beforeEach(async () => {
    console.log('cleare');
    await userTestHelper.clearUsersData();
    await examTestHelper.clearExams();
    await examTestHelper.clearExamQuestions();
    await examTestHelper.clearEnrolledExams();
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
        status: 1,
      };

      await request(app.getHttpServer())
        .put(`${baseUrl}/${exam._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateExamDto)
        .expect(HttpStatus.OK);

      const updatedExam = await examService.exists(exam._id);
      expect(toJSON(updatedExam)).toMatchObject(
        expect.objectContaining(updateExamDto),
      );
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

    it('should return exams filtered by authors', async () => {
      const user1 = await userTestHelper.createTestUser();
      const user2 = await userTestHelper.createTestUser({
        phone: '0987654322',
      });
      const user3 = await userTestHelper.createTestUser({
        phone: '0987654323',
      });

      const user1Exams = await examTestHelper.createTestExams(10, {
        preparedBy: user1._id,
      });

      const user2Exams = await examTestHelper.createTestExams(10, {
        preparedBy: user2._id,
      });

      const user3Exams = await examTestHelper.createTestExams(10, {
        preparedBy: user3._id,
      });

      const { body } = await request(app.getHttpServer())
        .get(`${baseUrl}?authors=${user1._id}&authors=${user2._id}&limit=25`)
        .expect(HttpStatus.OK);

      const responseForUser1 = examTestHelper.getResponse(user1Exams, user1);
      const responseForUser2 = examTestHelper.getResponse(user2Exams, user2);

      expect(body).toEqual([...responseForUser1, ...responseForUser2]);
    });
  });

  describe('fetchSingleExam', () => {
    it('should return single exam details', async () => {
      const user = await userTestHelper.createTestUser();
      const exam = await examTestHelper.createTestExam({
        preparedBy: user._id,
      });

      const { body } = await request(app.getHttpServer())
        .get(`${baseUrl}/${exam._id}`)
        .expect(HttpStatus.OK);

      const expectedResponse = examTestHelper.getResponse(exam, user);

      expect(body).toEqual(expectedResponse);
    });

    it('should reject with non exist exam', async () => {
      const id = mongoose.Types.ObjectId();
      const { body } = await request(app.getHttpServer())
        .get(`${baseUrl}/${id}`)
        .expect(HttpStatus.NOT_FOUND);
      expect(body.exception).toEqual(ExamDoesNotExistException.name);
    });
  });

  describe('deleteExam', () => {
    it('should reject with unauthenticated user', async () => {
      const id = mongoose.Types.ObjectId();
      await request(app.getHttpServer())
        .delete(`${baseUrl}/${id}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should reject with non exist exam', async () => {
      const id = mongoose.Types.ObjectId();
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);

      const { body } = await request(app.getHttpServer())
        .delete(`${baseUrl}/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.NOT_FOUND);
      expect(body.exception).toEqual(ExamDoesNotExistException.name);
    });

    it('should delete exam successfully', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const exam = await examTestHelper.createTestExam({
        preparedBy: user._id,
      });

      await request(app.getHttpServer())
        .delete(`${baseUrl}/${exam._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);

      const exists = await examService.exists(exam._id, false);
      expect(exists).toBeNull();
    });
  });

  describe('addExamQuestion', () => {
    it('should reject with validation error', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);

      const expectedMessage = [
        'question must be a string',
        'choices must be an array',
        'explanation must be a string',
        'correctAnswer must be a string',
        'examId must be a string',
      ];

      const { body } = await request(app.getHttpServer())
        .post(`${baseUrl}/question`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.BAD_REQUEST);

      expect(body.message).toEqual(expectedMessage);
    });

    it('should reject with unauthenticated user', async () => {
      await request(app.getHttpServer())
        .post(`${baseUrl}/question`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should reject with non existing exam', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const examId = mongoose.Types.ObjectId().toHexString();
      const addExamQuestionDto: AddExamQuestionDto =
        examTestHelper.generateAddExamQuestionDto({ examId });

      const { body } = await request(app.getHttpServer())
        .post(`${baseUrl}/question`)
        .set('Authorization', `Bearer ${token}`)
        .send(addExamQuestionDto)
        .expect(HttpStatus.NOT_FOUND);

      expect(body.exception).toEqual(ExamDoesNotExistException.name);
    });

    it('should reject with duplicate question', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const exam = await examTestHelper.createTestExam({
        preparedBy: user._id,
      });
      const addExamQuestionDto: AddExamQuestionDto =
        examTestHelper.generateAddExamQuestionDto({ examId: exam._id });
      await examQuestionService.addQuestionToExam(addExamQuestionDto);

      await request(app.getHttpServer())
        .post(`${baseUrl}/question`)
        .set('Authorization', `Bearer ${token}`)
        .send(addExamQuestionDto)
        .expect(HttpStatus.BAD_REQUEST);
      const questions = await examQuestionService.fetchAll(exam._id);
      expect(questions).toHaveLength(1);
    });

    it('should reject with duplicate answer', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const exam = await examTestHelper.createTestExam({
        preparedBy: user._id,
      });
      const addExamQuestionDto: AddExamQuestionDto =
        examTestHelper.generateAddExamQuestionDto({
          examId: exam._id,
          choices: [
            { key: 'A', choice: 'A' },
            { key: 'B', choice: 'A' },
          ],
        });

      const { body } = await request(app.getHttpServer())
        .post(`${baseUrl}/question`)
        .set('Authorization', `Bearer ${token}`)
        .send(addExamQuestionDto)
        .expect(HttpStatus.BAD_REQUEST);

      const questions = await examQuestionService.fetchAll(exam._id);
      expect(questions).toHaveLength(0);
      expect(body.exception).toEqual(DuplicateChoiceValueFoundException.name);
    });

    it('should reject with correct answer not found', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const exam = await examTestHelper.createTestExam({
        preparedBy: user._id,
      });
      const addExamQuestionDto: AddExamQuestionDto =
        examTestHelper.generateAddExamQuestionDto({
          examId: exam._id,
          correctAnswer: 'C',
          choices: [
            { key: 'A', choice: 'A' },
            { key: 'B', choice: 'B' },
          ],
        });

      const { body } = await request(app.getHttpServer())
        .post(`${baseUrl}/question`)
        .set('Authorization', `Bearer ${token}`)
        .send(addExamQuestionDto)
        .expect(HttpStatus.BAD_REQUEST);

      const questions = await examQuestionService.fetchAll(exam._id);
      expect(questions).toHaveLength(0);
      expect(body.exception).toEqual(AnswerKeyNotPartOfChoiceException.name);
    });
  });

  describe('updateExamQuestion', () => {
    it('should reject with unauthenticated user', async () => {
      const id = mongoose.Types.ObjectId();
      await request(app.getHttpServer())
        .put(`${baseUrl}/question/${id}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should reject with non existing exam question', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const questionId = mongoose.Types.ObjectId().toHexString();

      const { body } = await request(app.getHttpServer())
        .put(`${baseUrl}/question/${questionId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.NOT_FOUND);

      expect(body.exception).toEqual(ExamQuestionDoesNotExistException.name);
    });

    it('should reject with duplicate question', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const exam = await examTestHelper.createTestExam({
        preparedBy: user._id,
      });
      const addExamQuestionDto: AddExamQuestionDto =
        examTestHelper.generateAddExamQuestionDto({ examId: exam._id });
      const question = await examQuestionService.addQuestionToExam(
        addExamQuestionDto,
      );
      const updateExamDto: UpdateExamQuestionDto = {
        question: addExamQuestionDto.question,
      };

      const { body } = await request(app.getHttpServer())
        .put(`${baseUrl}/question/${question._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateExamDto)
        .expect(HttpStatus.BAD_REQUEST);

      expect(body.exception).toEqual(QuestionAlreadyAddedException.name);
    });

    it('should reject with duplicate answer value', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const exam = await examTestHelper.createTestExam({
        preparedBy: user._id,
      });

      const addExamQuestionDto: AddExamQuestionDto =
        examTestHelper.generateAddExamQuestionDto({
          examId: exam._id,
          choices: [
            { key: 'A', choice: 'A' },
            { key: 'B', choice: 'B' },
          ],
        });

      let question = await examQuestionService.addQuestionToExam(
        addExamQuestionDto,
      );

      const updateExamQuestionDto: UpdateExamQuestionDto = {
        choices: [
          { key: 'A', choice: 'A' },
          { key: 'B', choice: 'A' },
        ],
      };

      const { body } = await request(app.getHttpServer())
        .put(`${baseUrl}/question/${question._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateExamQuestionDto)
        .expect(HttpStatus.BAD_REQUEST);

      question = await examQuestionService.exists(question._id);
      expect(toJSON(question).choices).toEqual(addExamQuestionDto.choices);
      expect(body.exception).toEqual(DuplicateChoiceValueFoundException.name);
    });

    it('should reject with duplicate answer key', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const exam = await examTestHelper.createTestExam({
        preparedBy: user._id,
      });

      const addExamQuestionDto: AddExamQuestionDto =
        examTestHelper.generateAddExamQuestionDto({
          examId: exam._id,
          choices: [
            { key: 'A', choice: 'A' },
            { key: 'B', choice: 'B' },
          ],
        });

      let question = await examQuestionService.addQuestionToExam(
        addExamQuestionDto,
      );

      const updateExamQuestionDto: UpdateExamQuestionDto = {
        choices: [
          { key: 'A', choice: 'A' },
          { key: 'A', choice: 'B' },
        ],
      };

      const { body } = await request(app.getHttpServer())
        .put(`${baseUrl}/question/${question._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateExamQuestionDto)
        .expect(HttpStatus.BAD_REQUEST);

      question = await examQuestionService.exists(question._id);
      expect(toJSON(question).choices).toEqual(addExamQuestionDto.choices);
      expect(body.exception).toEqual(DuplicateChoiceKeyFoundException.name);
    });

    it('should reject with correct answer not found when updating correctAnswer', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const exam = await examTestHelper.createTestExam({
        preparedBy: user._id,
      });

      const addExamQuestionDto: AddExamQuestionDto =
        examTestHelper.generateAddExamQuestionDto({
          examId: exam._id,
          choices: [
            { key: 'A', choice: 'A' },
            { key: 'B', choice: 'B' },
          ],
        });

      let question = await examQuestionService.addQuestionToExam(
        addExamQuestionDto,
      );

      const updateExamQuestionDto: UpdateExamQuestionDto = {
        correctAnswer: 'C',
      };

      const { body } = await request(app.getHttpServer())
        .put(`${baseUrl}/question/${question._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateExamQuestionDto)
        .expect(HttpStatus.BAD_REQUEST);

      question = await examQuestionService.exists(question._id);
      expect(toJSON(question).choices).toEqual(addExamQuestionDto.choices);
      expect(body.exception).toEqual(AnswerKeyNotPartOfChoiceException.name);
    });

    it('should reject with correct answer not found when updating choices', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const exam = await examTestHelper.createTestExam({
        preparedBy: user._id,
      });

      const addExamQuestionDto: AddExamQuestionDto =
        examTestHelper.generateAddExamQuestionDto({
          examId: exam._id,
          choices: [
            { key: 'A', choice: 'A' },
            { key: 'B', choice: 'B' },
          ],
        });

      let question = await examQuestionService.addQuestionToExam(
        addExamQuestionDto,
      );

      const updateExamQuestionDto: UpdateExamQuestionDto = {
        choices: [{ key: 'C', choice: 'C' }],
      };

      const { body } = await request(app.getHttpServer())
        .put(`${baseUrl}/question/${question._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateExamQuestionDto)
        .expect(HttpStatus.BAD_REQUEST);

      question = await examQuestionService.exists(question._id);
      expect(toJSON(question).choices).toEqual(addExamQuestionDto.choices);
      expect(body.exception).toEqual(AnswerKeyNotPartOfChoiceException.name);
    });
    it('should reject with correct answer not found when updating choices and correctAnswer', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const exam = await examTestHelper.createTestExam({
        preparedBy: user._id,
      });

      const addExamQuestionDto: AddExamQuestionDto =
        examTestHelper.generateAddExamQuestionDto({
          examId: exam._id,
          choices: [
            { key: 'A', choice: 'A' },
            { key: 'B', choice: 'B' },
          ],
        });

      let question = await examQuestionService.addQuestionToExam(
        addExamQuestionDto,
      );

      const updateExamQuestionDto: UpdateExamQuestionDto = {
        correctAnswer: 'D',
        choices: [{ key: 'C', choice: 'C' }],
      };

      const { body } = await request(app.getHttpServer())
        .put(`${baseUrl}/question/${question._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateExamQuestionDto)
        .expect(HttpStatus.BAD_REQUEST);

      question = await examQuestionService.exists(question._id);
      expect(toJSON(question).choices).toEqual(addExamQuestionDto.choices);
      expect(body.exception).toEqual(AnswerKeyNotPartOfChoiceException.name);
    });

    it('should update exam question successfully', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const exam = await examTestHelper.createTestExam({
        preparedBy: user._id,
      });

      const addExamQuestionDto: AddExamQuestionDto =
        examTestHelper.generateAddExamQuestionDto({
          examId: exam._id,
        });

      const question = await examQuestionService.addQuestionToExam(
        addExamQuestionDto,
      );

      const updateExamQuestionDto: UpdateExamQuestionDto = {
        question: 'new question',
        explanation: 'new explanation',
        correctAnswer: 'D',
        choices: [{ key: 'D', choice: 'D' }],
      };

      await request(app.getHttpServer())
        .put(`${baseUrl}/question/${question._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateExamQuestionDto)
        .expect(HttpStatus.OK);

      const updatedQuestion = await examQuestionService.exists(question._id);
      expect(toJSON(updatedQuestion)).toMatchObject(
        expect.objectContaining(updateExamQuestionDto),
      );
    });
  });

  describe('deleteExamQuestion', () => {
    it('should reject with non existing exam question', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const questionId = mongoose.Types.ObjectId().toHexString();

      const { body } = await request(app.getHttpServer())
        .delete(`${baseUrl}/question/${questionId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.NOT_FOUND);

      expect(body.exception).toEqual(ExamQuestionDoesNotExistException.name);
    });

    it('should reject with unauthenticated user', async () => {
      const id = mongoose.Types.ObjectId();
      await request(app.getHttpServer())
        .delete(`${baseUrl}/question/${id}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should delete exam question successfully', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const exam = await examTestHelper.createTestExam({
        preparedBy: user._id,
      });

      const addExamQuestionDto: AddExamQuestionDto =
        examTestHelper.generateAddExamQuestionDto({
          examId: exam._id,
        });

      let question = await examQuestionService.addQuestionToExam(
        addExamQuestionDto,
      );
      await request(app.getHttpServer())
        .delete(`${baseUrl}/question/${question._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);
      question = await examQuestionService.exists(question._id, false);
      expect(question).toBeNull();
    });
  });

  describe('fetchQuestionsForSingleExam', () => {
    it('should reject with non existing exam ', async () => {
      const examId = mongoose.Types.ObjectId().toHexString();

      const { body } = await request(app.getHttpServer())
        .get(`${baseUrl}/${examId}/question`)
        .expect(HttpStatus.NOT_FOUND);

      expect(body.exception).toEqual(ExamDoesNotExistException.name);
    });

    it('should return exam questions successfully with default pagination', async () => {
      const user = await userTestHelper.createTestUser();
      const exam = await examTestHelper.createTestExam({
        preparedBy: user._id,
      });

      const questions = await examTestHelper.addTestExamQuestions(
        PaginationOption.DEFAULT_LIMIT * 2,
        {
          examId: exam._id,
        },
      );

      const { body } = await request(app.getHttpServer())
        .get(`${baseUrl}/${exam._id}/question`)
        .expect(HttpStatus.OK);

      const expectedResponse = examTestHelper.getExamQuestionResponse(
        questions.filter((_, index) => index < PaginationOption.DEFAULT_LIMIT),
      );
      expect(body).toEqual(expectedResponse);
    });

    it('should return exam questions successfully with default pagination', async () => {
      const user = await userTestHelper.createTestUser();
      const exam = await examTestHelper.createTestExam({
        preparedBy: user._id,
      });

      const questions = await examTestHelper.addTestExamQuestions(
        PaginationOption.DEFAULT_LIMIT,
        {
          examId: exam._id,
        },
      );

      const { body } = await request(app.getHttpServer())
        .get(`${baseUrl}/${exam._id}/question?limit=5&offset=5`)
        .expect(HttpStatus.OK);

      const expectedResponse = examTestHelper.getExamQuestionResponse(
        questions.filter((_, index) => index >= 5 && index < 10),
      );
      expect(body).toEqual(expectedResponse);
    });
  });

  describe('fetchSampleQuestionsForSingleExam', () => {
    it('should reject with non existing exam ', async () => {
      const examId = mongoose.Types.ObjectId().toHexString();

      const { body } = await request(app.getHttpServer())
        .get(`${baseUrl}/${examId}/question/samples`)
        .expect(HttpStatus.NOT_FOUND);

      expect(body.exception).toEqual(ExamDoesNotExistException.name);
    });

    it('should return sample exam questions with default pagination', async () => {
      const user = await userTestHelper.createTestUser();
      const exam = await examTestHelper.createTestExam({
        preparedBy: user._id,
      });

      const questions = await examTestHelper.addTestExamQuestions(
        PaginationOption.DEFAULT_LIMIT * 2,
        {
          examId: exam._id,
        },
      );

      const updateExamDto: UpdateExamDto = {
        samples: questions.map((q) => q._id),
      };

      await examService.updateExam(exam._id, updateExamDto);

      const { body } = await request(app.getHttpServer())
        .get(`${baseUrl}/${exam._id}/question/samples`)
        .expect(HttpStatus.OK);

      const expectedResponse = examTestHelper.getExamQuestionResponse(
        questions.filter((_, index) => index < PaginationOption.DEFAULT_LIMIT),
      );
      expect(body).toEqual(expectedResponse);
    });

    it('should return sample exam questions with limit and offset', async () => {
      const user = await userTestHelper.createTestUser();
      const exam = await examTestHelper.createTestExam({
        preparedBy: user._id,
      });

      const questions = await examTestHelper.addTestExamQuestions(
        PaginationOption.DEFAULT_LIMIT,
        {
          examId: exam._id,
        },
      );

      const updateExamDto: UpdateExamDto = {
        samples: questions.map((q) => q._id),
      };

      await examService.updateExam(exam._id, updateExamDto);

      const { body } = await request(app.getHttpServer())
        .get(`${baseUrl}/${exam._id}/question/samples?limit=5&offset=5`)
        .expect(HttpStatus.OK);

      const expectedResponse = examTestHelper.getExamQuestionResponse(
        questions.filter((_, index) => index >= 5 && index < 10),
      );
      expect(body).toEqual(expectedResponse);
    });
  });

  describe('enrollForExam', () => {
    it('should reject with validation error', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);

      const expectedMessage = ['exam must be a string'];

      const { body } = await request(app.getHttpServer())
        .post(`${baseUrl}/enroll`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.BAD_REQUEST);

      expect(body.message).toEqual(expectedMessage);
    });

    it('should reject with unauthenticated user', async () => {
      await request(app.getHttpServer())
        .post(`${baseUrl}/enroll`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should reject with non existing exam', async () => {
      const exam = mongoose.Types.ObjectId();
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);

      const { body } = await request(app.getHttpServer())
        .post(`${baseUrl}/enroll`)
        .set('Authorization', `Bearer ${token}`)
        .send({ exam })
        .expect(HttpStatus.NOT_FOUND);

      expect(body.exception).toEqual(ExamDoesNotExistException.name);
    });

    it('should enroll for an exam successfully', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const exam = await examTestHelper.createTestExam({
        preparedBy: user._id,
      });
      const enrollForExamDto: EnrollForExamDto = {
        exam: exam._id.toString(),
        examinee: user._id.toString(),
      };

      await request(app.getHttpServer())
        .post(`${baseUrl}/enroll`)
        .set('Authorization', `Bearer ${token}`)
        .send(enrollForExamDto)
        .expect(HttpStatus.CREATED);

      const enrolledExam = await examEnrollmentService.exists(
        exam._id,
        user._id,
      );
      expect(toJSON(enrolledExam)).toMatchObject(
        expect.objectContaining(enrollForExamDto),
      );
    });
  });

  describe('fetchEnrolledExams', () => {
    it('should reject with unauthenticated user', async () => {
      await request(app.getHttpServer())
        .get(`${baseUrl}/enrolled`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return enrolled exams with default pagination', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      await examTestHelper.createTestEnrolledExams(
        PaginationOption.DEFAULT_LIMIT * 2,
        user._id,
      );

      const { body } = await request(app.getHttpServer())
        .get(`${baseUrl}/enrolled`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);

      expect(body.length).toEqual(PaginationOption.DEFAULT_LIMIT);
    });

    it('should return enrolled exams with given limit and offset', async () => {
      const limit = 5;
      const offset = 5;
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const enrolledExams = await examTestHelper.createTestEnrolledExams(
        PaginationOption.DEFAULT_LIMIT * 2,
        user._id,
      );

      const { body } = await request(app.getHttpServer())
        .get(`${baseUrl}/enrolled?limit=${limit}&offset=${offset}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);

      expect(body.length).toEqual(limit);
      expect(body[0]._id).toEqual(enrolledExams[offset]._id.toString());
    });
  });

  describe('addExamAnswer', () => {
    it('should reject with validation error', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const enrolledExam = await examTestHelper.createTestEnrolledExams(
        1,
        user._id,
      );
      const expectedMessage = [
        'questionId must be a string',
        'answer must be a string',
      ];

      const { body } = await request(app.getHttpServer())
        .put(`${baseUrl}/${enrolledExam[0].exam}/answer`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.BAD_REQUEST);

      expect(body.message).toEqual(expectedMessage);
    });

    it('should reject with unauthenticated user', async () => {
      const examId = mongoose.Types.ObjectId().toHexString();
      await request(app.getHttpServer())
        .put(`${baseUrl}/${examId}/answer`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should reject with non existing exam', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const exam = await examTestHelper.createTestExam({
        preparedBy: user._id,
      });
      const addExamQuestionDto: AddExamQuestionDto =
        examTestHelper.generateAddExamQuestionDto({
          examId: exam._id,
        });

      const question = await examQuestionService.addQuestionToExam(
        addExamQuestionDto,
      );

      await examTestHelper.createTestEnrolledExam(exam._id, user._id);
      const examId = mongoose.Types.ObjectId().toHexString();

      const answerExamQuestionDto =
        await examTestHelper.generateAnswerExamQuestionDto({
          questionId: question._id,
        });

      const { body } = await request(app.getHttpServer())
        .put(`${baseUrl}/${examId}/answer`)
        .set('Authorization', `Bearer ${token}`)
        .send(answerExamQuestionDto)
        .expect(HttpStatus.NOT_FOUND);

      expect(body.exception).toEqual(ExamDoesNotExistException.name);
    });

    it('should reject with non existing question', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const exam = await examTestHelper.createTestExam({
        preparedBy: user._id,
      });

      const answerExamQuestionDto =
        await examTestHelper.generateAnswerExamQuestionDto({
          questionId: mongoose.Types.ObjectId().toHexString(),
        });

      const { body } = await request(app.getHttpServer())
        .put(`${baseUrl}/${exam._id}/answer`)
        .set('Authorization', `Bearer ${token}`)
        .send(answerExamQuestionDto)
        .expect(HttpStatus.NOT_FOUND);

      expect(body.exception).toEqual(ExamQuestionDoesNotExistException.name);
    });

    it('should reject with question not part of exam', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const exam1 = await examTestHelper.createTestExam({
        preparedBy: user._id,
      });
      const exam2 = await examTestHelper.createTestExam({
        preparedBy: user._id,
      });

      const addExamQuestionDto: AddExamQuestionDto =
        examTestHelper.generateAddExamQuestionDto({
          examId: exam2._id,
        });

      const question = await examQuestionService.addQuestionToExam(
        addExamQuestionDto,
      );

      await examTestHelper.createTestEnrolledExam(exam1._id, user._id);

      const answerExamQuestionDto =
        await examTestHelper.generateAnswerExamQuestionDto({
          questionId: question._id,
        });

      const { body } = await request(app.getHttpServer())
        .put(`${baseUrl}/${exam1._id}/answer`)
        .set('Authorization', `Bearer ${token}`)
        .send(answerExamQuestionDto)
        .expect(HttpStatus.BAD_REQUEST);

      expect(body.exception).toEqual(QuestionDoesNotBelongToExamException.name);
    });

    it('should reject with correct answer not found', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const exam = await examTestHelper.createTestExam({
        preparedBy: user._id,
      });
      const addExamQuestionDto: AddExamQuestionDto =
        examTestHelper.generateAddExamQuestionDto({
          examId: exam._id,
        });

      const question = await examQuestionService.addQuestionToExam(
        addExamQuestionDto,
      );

      await examTestHelper.createTestEnrolledExam(exam._id, user._id);

      const answerExamQuestionDto =
        await examTestHelper.generateAnswerExamQuestionDto({
          questionId: question._id,
          answer: 'J',
        });

      const { body } = await request(app.getHttpServer())
        .put(`${baseUrl}/${exam._id}/answer`)
        .set('Authorization', `Bearer ${token}`)
        .send(answerExamQuestionDto)
        .expect(HttpStatus.BAD_REQUEST);

      expect(body.exception).toEqual(AnswerKeyNotPartOfChoiceException.name);
    });

    it('should reject for not user enrolled for exam', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const exam = await examTestHelper.createTestExam({
        preparedBy: user._id,
      });
      const addExamQuestionDto: AddExamQuestionDto =
        examTestHelper.generateAddExamQuestionDto({
          examId: exam._id,
        });

      const question = await examQuestionService.addQuestionToExam(
        addExamQuestionDto,
      );

      const answerExamQuestionDto =
        await examTestHelper.generateAnswerExamQuestionDto({
          questionId: question._id,
        });

      const { body } = await request(app.getHttpServer())
        .put(`${baseUrl}/${exam._id}/answer`)
        .set('Authorization', `Bearer ${token}`)
        .send(answerExamQuestionDto)
        .expect(HttpStatus.NOT_FOUND);

      expect(body.exception).toEqual(NotEnrolledException.name);
    });

    it('should answer exam question', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const exam = await examTestHelper.createTestExam({
        preparedBy: user._id,
      });
      const addExamQuestionDto: AddExamQuestionDto =
        examTestHelper.generateAddExamQuestionDto({
          examId: exam._id,
        });

      const question = await examQuestionService.addQuestionToExam(
        addExamQuestionDto,
      );

      await examTestHelper.createTestEnrolledExam(exam._id, user._id);

      const answerExamQuestionDto =
        await examTestHelper.generateAnswerExamQuestionDto({
          questionId: question._id,
        });

      const { body } = await request(app.getHttpServer())
        .put(`${baseUrl}/${exam._id}/answer`)
        .set('Authorization', `Bearer ${token}`)
        .send(answerExamQuestionDto)
        .expect(HttpStatus.OK);

      const enrolledExam = await examEnrollmentService.exists(
        exam._id,
        user._id,
        false,
      );
      expect(body._id).toEqual(enrolledExam._id.toHexString());
    });

    it('should answer exam question for already answered question', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const exam = await examTestHelper.createTestExam({
        preparedBy: user._id,
      });
      const addExamQuestionDto: AddExamQuestionDto =
        examTestHelper.generateAddExamQuestionDto({
          examId: exam._id,
        });

      const question = await examQuestionService.addQuestionToExam(
        addExamQuestionDto,
      );

      await examTestHelper.createTestEnrolledExam(exam._id, user._id);

      const answerExamQuestionDto =
        await examTestHelper.generateAnswerExamQuestionDto({
          questionId: question._id,
          answer: 'A',
        });

      await examEnrollmentService.answerExamQuestion(
        exam._id,
        user._id,
        question._id,
        'D',
      );

      await request(app.getHttpServer())
        .put(`${baseUrl}/${exam._id}/answer`)
        .set('Authorization', `Bearer ${token}`)
        .send(answerExamQuestionDto)
        .expect(HttpStatus.OK);

      const enrolledExam = await examEnrollmentService.exists(
        exam._id,
        user._id,
        false,
      );
      expect(enrolledExam.answers[0].answer).toEqual('A');
    });
  });
});
