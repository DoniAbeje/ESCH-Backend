import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model } from 'mongoose';
import { RaiseQuestionDto } from './dto/raise-question.dto';
import { Answer, AnswerDocument } from './schema/answer.schema';
import { Question, QuestionDocument } from './schema/question.schema';
import * as faker from 'faker';
import { QuestionService } from './question.service';
import { UserDocument } from '../user/schemas/user.schema';
import { toJSON } from '../utils/utils';
import { AnswerQuestionDto } from './dto/answer-question.dto';
import { AnswerService } from './answer.service';

@Injectable()
export class QaTestHelperService {
  constructor(
    @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
    @InjectModel(Answer.name) private answerModel: Model<AnswerDocument>,
    private questionService: QuestionService,
    private answerService: AnswerService,
  ) {}

  async clearQuestions() {
    return await this.questionModel.deleteMany({});
  }

  async clearAnswers() {
    return await this.answerModel.deleteMany({});
  }

  generateRaiseQuestionDto(
    override: Partial<RaiseQuestionDto> = {},
  ): RaiseQuestionDto {
    const _default: RaiseQuestionDto = {
      question: faker.lorem.sentence(),
      tags: [faker.lorem.word()],
      askedBy: '',
    };
    return { ..._default, ...override };
  }

  generateAnswerQuestionDto(
    override: Partial<AnswerQuestionDto> = {},
  ): AnswerQuestionDto {
    const _default: AnswerQuestionDto = {
      answer: faker.lorem.sentence(),
      answeredBy: '',
      question: '',
    };
    return { ..._default, ...override };
  }
  async createTestQuestions(
    amount: number,
    raiseQuestionDto: Partial<RaiseQuestionDto> = {},
  ): Promise<QuestionDocument[]> {
    const questions = [];
    for (let index = 0; index < amount; index++) {
      questions.push(await this.createTestQuestion(raiseQuestionDto));
    }
    return questions;
  }

  async createTestAnswers(
    amount: number,
    answerQuestionDto: Partial<AnswerQuestionDto> = {},
  ): Promise<AnswerDocument[]> {
    const answers = [];
    for (let index = 0; index < amount; index++) {
      answers.push(await this.createTestAnswer(answerQuestionDto));
    }
    return answers;
  }

  async createTestQuestion(
    override: Partial<RaiseQuestionDto> = {},
  ): Promise<QuestionDocument> {
    const raiseQuestionDto: RaiseQuestionDto =
      this.generateRaiseQuestionDto(override);
    return await this.questionService.raiseQuestion(raiseQuestionDto);
  }

  async createTestAnswer(
    override: Partial<AnswerQuestionDto> = {},
  ): Promise<AnswerDocument> {
    const answerQuestionDto: AnswerQuestionDto =
      this.generateAnswerQuestionDto(override);
    return await this.answerService.answerQuestion(answerQuestionDto);
  }

  getQuestionResponse(
    question: QuestionDocument | QuestionDocument[],
    user: UserDocument,
    loggedInUserId: string = null,
  ) {
    if (Array.isArray(question)) {
      return question.map((q) =>
        this.getSingleQuestionResponse(q, user, loggedInUserId),
      );
    }
    return this.getSingleQuestionResponse(question, user, loggedInUserId);
  }

  getAnswerResponse(
    answer: AnswerDocument | AnswerDocument[],
    user: UserDocument,
    loggedInUserId: string = null,
  ) {
    if (Array.isArray(answer)) {
      return answer.map((a) =>
        this.getSingleAnswerResponse(a, user, loggedInUserId),
      );
    }
    return this.getSingleAnswerResponse(answer, user);
  }

  private getSingleQuestionResponse(
    questionDocument: QuestionDocument,
    userDocument: UserDocument,
    loggedInUserId: string = null,
  ) {
    const _question: LeanDocument<QuestionDocument> = toJSON(questionDocument);
    const user: LeanDocument<UserDocument> = toJSON(userDocument);

    const askedBy = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePicture: user.profilePicture,
    };
    const upvotes = _question.upvotes.length;
    const downvotes = _question.downvotes.length;
    const { upvoted, downvoted } = this.getVoteFlags(_question, loggedInUserId);

    const { _id, question, createdAt, tags } = _question;
    return {
      _id,
      question,
      createdAt,
      tags,
      askedBy,
      upvotes,
      downvotes,
      upvoted,
      downvoted,
    };
  }

  private getSingleAnswerResponse(
    answerDocument: AnswerDocument,
    userDocument: UserDocument,
    loggedInUserId: string = null,
  ) {
    const userJson: LeanDocument<UserDocument> = toJSON(userDocument);
    const answerJson: LeanDocument<AnswerDocument> = toJSON(answerDocument);

    const answeredBy = {
      _id: userJson._id,
      firstName: userJson.firstName,
      lastName: userJson.lastName,
      profilePicture: userJson.profilePicture,
    };
    const upvotes = answerJson.upvotes.length;
    const downvotes = answerJson.downvotes.length;
    const { upvoted, downvoted } = this.getVoteFlags(
      answerJson,
      loggedInUserId,
    );

    const { _id, answer, question, createdAt } = answerJson;
    return {
      _id,
      answer,
      question,
      createdAt,
      answeredBy,
      upvotes,
      downvotes,
      upvoted,
      downvoted,
    };
  }

  private getVoteFlags(
    document: { upvotes; downvotes },
    loggedInUserId: string = null,
  ) {
    const upvoted = loggedInUserId
      ? document.upvotes.includes(loggedInUserId)
      : false;

    const downvoted = loggedInUserId
      ? document.downvotes.includes(loggedInUserId)
      : false;
    return { upvoted, downvoted };
  }
}
