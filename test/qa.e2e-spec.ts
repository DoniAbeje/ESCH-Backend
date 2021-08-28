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
import { QuestionDoesNotExistException } from '../src/qa/exceptions/question-doesnot-exist.exception';
import { AnswerQuestionDto } from '../src/qa/dto/answer-question.dto';
import { AnswerService } from '../src/qa/answer.service';
import { AnswerDoesNotExistException } from '../src/qa/exceptions/answer-doesnot-exist.exception';

describe('QA Module (e2e)', () => {
  let app: INestApplication;
  let qaTestHelper: QaTestHelperService;
  let userTestHelper: UserTestHelperService;
  let authService: AuthService;
  let questionService: QuestionService;
  let answerService: AnswerService;
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
    answerService = moduleFixture.get<AnswerService>(AnswerService);
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
    it('should reject with non existing id', async () => {
      const id = mongoose.Types.ObjectId();
      const { body } = await request(app.getHttpServer())
        .get(`${baseUrl}/${id}`)
        .expect(HttpStatus.NOT_FOUND);

      expect(body.exception).toEqual(QuestionDoesNotExistException.name);
    });

    it('should return single question details', async () => {
      const user = await userTestHelper.createTestUser();
      const question = await qaTestHelper.createTestQuestion({
        askedBy: user._id,
      });
      const { body } = await request(app.getHttpServer())
        .get(`${baseUrl}/${question._id}`)
        .expect(HttpStatus.OK);

      expect(body).toMatchObject(
        qaTestHelper.getQuestionResponse(question, user),
      );
    });
  });

  describe('answerQuestion', () => {
    it('should reject with unauthenticated user', async () => {
      await request(app.getHttpServer())
        .post(`${baseUrl}/id/answer`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should reject with input validation', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const question = await qaTestHelper.createTestQuestion({
        askedBy: user._id,
      });
      const expectedMessage = ['answer must be a string'];

      const { body } = await request(app.getHttpServer())
        .post(`${baseUrl}/${question._id}/answer`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.BAD_REQUEST);

      expect(body.message).toEqual(expectedMessage);
    });

    it('should answer a question successfully', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const question = await qaTestHelper.createTestQuestion({
        askedBy: user._id,
      });
      const answerQuestionDto: AnswerQuestionDto =
        qaTestHelper.generateAnswerQuestionDto();

      const { body } = await request(app.getHttpServer())
        .post(`${baseUrl}/${question._id}/answer`)
        .set('Authorization', `Bearer ${token}`)
        .send(answerQuestionDto)
        .expect(HttpStatus.CREATED);

      const savedAnswer = await answerService.exists(body._id);

      answerQuestionDto.answeredBy = toJSON(user)._id;
      answerQuestionDto.question = toJSON(question)._id;
      const savedAnswerJson = toJSON(savedAnswer);

      expect(body).toEqual({ _id: savedAnswerJson._id });
      expect(savedAnswerJson).toMatchObject(
        expect.objectContaining(answerQuestionDto),
      );
    });
  });

  describe('fetchAnswersForSingleQuestions', () => {
    it('should return all answers', async () => {
      const user = await userTestHelper.createTestUser();
      const question = await qaTestHelper.createTestQuestion({
        askedBy: user._id,
      });
      const answers = await qaTestHelper.createTestAnswers(
        PaginationOption.DEFAULT_LIMIT,
        {
          answeredBy: user._id,
          question: question._id,
        },
      );

      const { body } = await request(app.getHttpServer())
        .get(`${baseUrl}/${question._id}/answer`)
        .expect(HttpStatus.OK);

      const expectedResponse = qaTestHelper.getAnswerResponse(answers, user);
      expect(body).toEqual(expectedResponse);
    });

    it('should return answers with default pagination', async () => {
      const user = await userTestHelper.createTestUser();
      const question = await qaTestHelper.createTestQuestion({
        askedBy: user._id,
      });
      const answers = await qaTestHelper.createTestAnswers(
        PaginationOption.DEFAULT_LIMIT * 2,
        {
          answeredBy: user._id,
          question: question._id,
        },
      );

      const { body } = await request(app.getHttpServer())
        .get(`${baseUrl}/${question._id}/answer`)
        .expect(HttpStatus.OK);

      const expectedResponse = qaTestHelper.getAnswerResponse(
        answers.filter((_, index) => index < PaginationOption.DEFAULT_LIMIT),
        user,
      );

      expect(body).toEqual(expectedResponse);
    });

    it('should return paginated answers with given limit and offset', async () => {
      const user = await userTestHelper.createTestUser();
      const question = await qaTestHelper.createTestQuestion({
        askedBy: user._id,
      });
      const answers = await qaTestHelper.createTestAnswers(
        PaginationOption.DEFAULT_LIMIT * 2,
        {
          answeredBy: user._id,
          question: question._id,
        },
      );

      const limit = 5;
      const offset = 5;

      const { body } = await request(app.getHttpServer())
        .get(
          `${baseUrl}/${question._id}/answer?limit=${limit}&offset=${offset}`,
        )
        .expect(HttpStatus.OK);

      const expectedResponse = qaTestHelper.getAnswerResponse(
        answers.filter((_, index) => index >= offset && index < offset + limit),
        user,
      );

      expect(body).toEqual(expectedResponse);
    });

    it('shoul reject with non existing questionId', async () => {
      const questionId = mongoose.Types.ObjectId();
      const { body } = await request(app.getHttpServer())
        .get(`${baseUrl}/${questionId}/answer`)
        .expect(HttpStatus.NOT_FOUND);
      expect(body.exception).toEqual(QuestionDoesNotExistException.name);
    });
  });

  describe('upvoteQuestion', () => {
    it('should upvote question that is not voted before', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const question = await qaTestHelper.createTestQuestion({
        askedBy: user._id,
      });

      await request(app.getHttpServer())
        .post(`${baseUrl}/${question._id}/upvote`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.CREATED);

      const upvotedQuestion = await questionService.exists(question._id);
      const upvotedQuestionJson = toJSON(upvotedQuestion);

      expect(upvotedQuestionJson.upvotes).toEqual([toJSON(user)._id]);
      expect(upvotedQuestionJson.downvotes).toHaveLength(0);
    });

    it('should upvote question that is voted before', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const question = await qaTestHelper.createTestQuestion({
        askedBy: user._id,
      });
      await questionService.upvote(question._id, user._id);

      await request(app.getHttpServer())
        .post(`${baseUrl}/${question._id}/upvote`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.CREATED);

      const upvotedQuestion = await questionService.exists(question._id);
      const upvotedQuestionJson = toJSON(upvotedQuestion);

      expect(upvotedQuestionJson.upvotes).toEqual([toJSON(user)._id]);
      expect(upvotedQuestionJson.downvotes).toHaveLength(0);
    });

    it('should upvote question that is downvoted before', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const question = await qaTestHelper.createTestQuestion({
        askedBy: user._id,
      });
      await questionService.downvote(question._id, user._id);

      await request(app.getHttpServer())
        .post(`${baseUrl}/${question._id}/upvote`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.CREATED);

      const upvotedQuestion = await questionService.exists(question._id);
      const upvotedQuestionJson = toJSON(upvotedQuestion);

      expect(upvotedQuestionJson.upvotes).toEqual([toJSON(user)._id]);
      expect(upvotedQuestionJson.downvotes).toHaveLength(0);
    });

    it('should reject with non existing id', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const questionId = mongoose.Types.ObjectId();

      const { body } = await request(app.getHttpServer())
        .post(`${baseUrl}/${questionId}/upvote`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.NOT_FOUND);

      expect(body.exception).toEqual(QuestionDoesNotExistException.name);
    });

    it('should reject with unauthenticated user', async () => {
      const questionId = mongoose.Types.ObjectId();

      const { body } = await request(app.getHttpServer())
        .post(`${baseUrl}/${questionId}/upvote`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('downvoteQuestion', () => {
    it('should downvote question that is not voted before', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const question = await qaTestHelper.createTestQuestion({
        askedBy: user._id,
      });

      await request(app.getHttpServer())
        .post(`${baseUrl}/${question._id}/downvote`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.CREATED);

      const downvotedQuestion = await questionService.exists(question._id);
      const downvotedQuestionJson = toJSON(downvotedQuestion);

      expect(downvotedQuestionJson.downvotes).toEqual([toJSON(user)._id]);
      expect(downvotedQuestionJson.upvotes).toHaveLength(0);
    });

    it('should downvote question that is downvoted before', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const question = await qaTestHelper.createTestQuestion({
        askedBy: user._id,
      });
      await questionService.downvote(question._id, user._id);

      await request(app.getHttpServer())
        .post(`${baseUrl}/${question._id}/downvote`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.CREATED);

      const downvotedQuestion = await questionService.exists(question._id);
      const downvotedQuestionJson = toJSON(downvotedQuestion);

      expect(downvotedQuestionJson.downvotes).toEqual([toJSON(user)._id]);
      expect(downvotedQuestionJson.upvotes).toHaveLength(0);
    });

    it('should downvote question that is upvoted before', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const question = await qaTestHelper.createTestQuestion({
        askedBy: user._id,
      });
      await questionService.upvote(question._id, user._id);

      await request(app.getHttpServer())
        .post(`${baseUrl}/${question._id}/downvote`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.CREATED);

      const downvotedQuestion = await questionService.exists(question._id);
      const downvotedQuestionJson = toJSON(downvotedQuestion);

      expect(downvotedQuestionJson.downvotes).toEqual([toJSON(user)._id]);
      expect(downvotedQuestionJson.upvotes).toHaveLength(0);
    });

    it('should reject with non existing id', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const questionId = mongoose.Types.ObjectId();

      const { body } = await request(app.getHttpServer())
        .post(`${baseUrl}/${questionId}/downvote`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.NOT_FOUND);

      expect(body.exception).toEqual(QuestionDoesNotExistException.name);
    });

    it('should reject with unauthenticated user', async () => {
      const questionId = mongoose.Types.ObjectId();

      const { body } = await request(app.getHttpServer())
        .post(`${baseUrl}/${questionId}/downvote`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('cancelQuestionVote', () => {
    it('should cancel vote that is downvoted before', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      let question = await qaTestHelper.createTestQuestion({
        askedBy: user._id,
      });
      await questionService.downvote(question._id, user._id);
      question = await questionService.exists(question._id);
      expect(toJSON(question).downvotes).toEqual([toJSON(user)._id]);

      await request(app.getHttpServer())
        .post(`${baseUrl}/${question._id}/cancel-vote`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.CREATED);

      const updatedQuestion = await questionService.exists(question._id);
      const updatedQuestionJson = toJSON(updatedQuestion);

      expect(updatedQuestionJson.downvotes).toHaveLength(0);
      expect(updatedQuestionJson.upvotes).toHaveLength(0);
    });

    it('should cancel vote that is upvoted before', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      let question = await qaTestHelper.createTestQuestion({
        askedBy: user._id,
      });
      await questionService.upvote(question._id, user._id);
      question = await questionService.exists(question._id);
      expect(toJSON(question).upvotes).toEqual([toJSON(user)._id]);

      await request(app.getHttpServer())
        .post(`${baseUrl}/${question._id}/cancel-vote`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.CREATED);

      const updatedQuestion = await questionService.exists(question._id);
      const updatedQuestionJson = toJSON(updatedQuestion);

      expect(updatedQuestionJson.downvotes).toHaveLength(0);
      expect(updatedQuestionJson.upvotes).toHaveLength(0);
    });
  });

  describe('upvoteAnswer', () => {
    it('should upvote answer that is not voted before', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const question = await qaTestHelper.createTestQuestion({
        askedBy: user._id,
      });
      const answer = await qaTestHelper.createTestAnswer({
        answeredBy: user._id,
        question: question._id,
      });

      await request(app.getHttpServer())
        .post(`${baseUrl}/answer/${answer._id}/upvote`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.CREATED);

      const upvotedAnswer = await answerService.exists(answer._id);
      const upvotedAnswerJson = toJSON(upvotedAnswer);

      expect(upvotedAnswerJson.upvotes).toEqual([toJSON(user)._id]);
      expect(upvotedAnswerJson.downvotes).toHaveLength(0);
    });

    it('should upvote answer that is voted before', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const question = await qaTestHelper.createTestQuestion({
        askedBy: user._id,
      });
      const answer = await qaTestHelper.createTestAnswer({
        answeredBy: user._id,
        question: question._id,
      });
      await answerService.upvote(answer._id, user._id);

      await request(app.getHttpServer())
        .post(`${baseUrl}/answer/${answer._id}/upvote`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.CREATED);

      const upvotedAnswer = await answerService.exists(answer._id);
      const upvotedAnswerJson = toJSON(upvotedAnswer);

      expect(upvotedAnswerJson.upvotes).toEqual([toJSON(user)._id]);
      expect(upvotedAnswerJson.downvotes).toHaveLength(0);
    });

    it('should upvote answer that is downvoted before', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const question = await qaTestHelper.createTestQuestion({
        askedBy: user._id,
      });
      const answer = await qaTestHelper.createTestAnswer({
        answeredBy: user._id,
        question: question._id,
      });
      await answerService.downvote(answer._id, user._id);

      await request(app.getHttpServer())
        .post(`${baseUrl}/answer/${answer._id}/upvote`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.CREATED);

      const upvotedAnswer = await answerService.exists(answer._id);
      const upvotedAnswerJson = toJSON(upvotedAnswer);

      expect(upvotedAnswerJson.upvotes).toEqual([toJSON(user)._id]);
      expect(upvotedAnswerJson.downvotes).toHaveLength(0);
    });

    it('should reject with non existing id', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const answerId = mongoose.Types.ObjectId();

      const { body } = await request(app.getHttpServer())
        .post(`${baseUrl}/answer/${answerId}/upvote`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.NOT_FOUND);

      expect(body.exception).toEqual(AnswerDoesNotExistException.name);
    });

    it('should reject with unauthenticated user', async () => {
      const answerId = mongoose.Types.ObjectId();

      await request(app.getHttpServer())
        .post(`${baseUrl}/answer/${answerId}/upvote`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('downvoteAnswer', () => {
    it('should downvote answer that is not voted before', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const question = await qaTestHelper.createTestQuestion({
        askedBy: user._id,
      });
      const answer = await qaTestHelper.createTestAnswer({
        answeredBy: user._id,
        question: question._id,
      });

      await request(app.getHttpServer())
        .post(`${baseUrl}/answer/${answer._id}/downvote`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.CREATED);

      const downvotedAnswer = await answerService.exists(answer._id);
      const downvotedAnswerJson = toJSON(downvotedAnswer);

      expect(downvotedAnswerJson.downvotes).toEqual([toJSON(user)._id]);
      expect(downvotedAnswerJson.upvotes).toHaveLength(0);
    });

    it('should downvote answer that is voted before', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const question = await qaTestHelper.createTestQuestion({
        askedBy: user._id,
      });
      const answer = await qaTestHelper.createTestAnswer({
        answeredBy: user._id,
        question: question._id,
      });
      await answerService.downvote(answer._id, user._id);

      await request(app.getHttpServer())
        .post(`${baseUrl}/answer/${answer._id}/downvote`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.CREATED);

      const downvotedAnswer = await answerService.exists(answer._id);
      const downvotedAnswerJson = toJSON(downvotedAnswer);

      expect(downvotedAnswerJson.downvotes).toEqual([toJSON(user)._id]);
      expect(downvotedAnswerJson.upvotes).toHaveLength(0);
    });

    it('should downvote answer that is upvoted before', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const question = await qaTestHelper.createTestQuestion({
        askedBy: user._id,
      });
      const answer = await qaTestHelper.createTestAnswer({
        answeredBy: user._id,
        question: question._id,
      });
      await answerService.upvote(answer._id, user._id);

      await request(app.getHttpServer())
        .post(`${baseUrl}/answer/${answer._id}/downvote`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.CREATED);

      const downvotedAnswer = await answerService.exists(answer._id);
      const downvotedAnswerJson = toJSON(downvotedAnswer);

      expect(downvotedAnswerJson.downvotes).toEqual([toJSON(user)._id]);
      expect(downvotedAnswerJson.upvotes).toHaveLength(0);
    });

    it('should reject with non existing id', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const answerId = mongoose.Types.ObjectId();

      const { body } = await request(app.getHttpServer())
        .post(`${baseUrl}/answer/${answerId}/downvote`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.NOT_FOUND);

      expect(body.exception).toEqual(AnswerDoesNotExistException.name);
    });

    it('should reject with unauthenticated user', async () => {
      const answerId = mongoose.Types.ObjectId();

      await request(app.getHttpServer())
        .post(`${baseUrl}/answer/${answerId}/downvote`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('cancelAnswerVote', () => {
    it('should cancel vote that is downvoted before', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const question = await qaTestHelper.createTestQuestion({
        askedBy: user._id,
      });
      let answer = await qaTestHelper.createTestAnswer({
        answeredBy: user._id,
        question: question._id,
      });
      await answerService.downvote(answer._id, user._id);
      answer = await answerService.exists(answer._id);
      expect(toJSON(answer).downvotes).toEqual([toJSON(user)._id]);

      await request(app.getHttpServer())
        .post(`${baseUrl}/answer/${answer._id}/cancel-vote`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.CREATED);

      const updatedAnswer = await answerService.exists(answer._id);
      const updatedAnswerJson = toJSON(updatedAnswer);

      expect(updatedAnswerJson.downvotes).toHaveLength(0);
      expect(updatedAnswerJson.upvotes).toHaveLength(0);
    });

    it('should cancel vote that is upvoted before', async () => {
      const user = await userTestHelper.createTestUser();
      const token = await authService.signToken(user);
      const question = await qaTestHelper.createTestQuestion({
        askedBy: user._id,
      });
      let answer = await qaTestHelper.createTestAnswer({
        answeredBy: user._id,
        question: question._id,
      });
      await answerService.upvote(answer._id, user._id);
      answer = await answerService.exists(answer._id);
      expect(toJSON(answer).upvotes).toEqual([toJSON(user)._id]);

      await request(app.getHttpServer())
        .post(`${baseUrl}/answer/${answer._id}/cancel-vote`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.CREATED);

      const updatedAnswer = await answerService.exists(answer._id);
      const updatedAnswerJson = toJSON(updatedAnswer);

      expect(updatedAnswerJson.downvotes).toHaveLength(0);
      expect(updatedAnswerJson.upvotes).toHaveLength(0);
    });
  });
});
