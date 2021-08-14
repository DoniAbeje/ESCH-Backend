import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RaiseQuestionDto } from './dto/raise-question.dto';
import { Answer, AnswerDocument } from './schema/answer.schema';
import { Question, QuestionDocument } from './schema/question.schema';
import * as faker from 'faker';

@Injectable()
export class QaTestHelperService {
  constructor(
    @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
    @InjectModel(Answer.name) private answerModel: Model<AnswerDocument>,
  ) {}

  async clearQuestions() {
    return await this.questionModel.deleteMany({});
  }

  async clearAnswers() {
    return await this.answerModel.deleteMany({});
  }

  generateraiseQuestionDto(
    override: Partial<RaiseQuestionDto> = {},
  ): RaiseQuestionDto {
    const _default: RaiseQuestionDto = {
      question: faker.lorem.sentence(),
      tags: [faker.lorem.word()],
      askedBy: '',
    };
    return { ..._default, ...override };
  }
}
