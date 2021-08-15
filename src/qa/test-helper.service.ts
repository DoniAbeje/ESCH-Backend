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

@Injectable()
export class QaTestHelperService {
  constructor(
    @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
    @InjectModel(Answer.name) private answerModel: Model<AnswerDocument>,
    private questionService: QuestionService,
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

  async createTestQuestions(
    askedBy: string,
    amount: number,
  ): Promise<QuestionDocument[]> {
    const questions = [];
    for (let index = 0; index < amount; index++) {
      questions.push(await this.createTestQuestion({ askedBy }));
    }
    return questions;
  }

  async createTestQuestion(
    override: Partial<RaiseQuestionDto> = {},
  ): Promise<QuestionDocument> {
    const raiseQuestionDto: RaiseQuestionDto =
      this.generateRaiseQuestionDto(override);
    return await this.questionService.raiseQuestion(raiseQuestionDto);
  }

  getQuestionResponse(
    question: QuestionDocument | QuestionDocument[],
    user: UserDocument,
  ) {
    if (Array.isArray(question)) {
      return question.map((q) => this.getSingleQuestionResponse(q, user));
    }
    return this.getSingleQuestionResponse(question, user);
  }

  private getSingleQuestionResponse(
    questionDocument: QuestionDocument,
    userDocument: UserDocument,
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

    const { _id, question, createdAt, tags } = _question;
    return { _id, question, createdAt, tags, askedBy, upvotes, downvotes };
  }
}
