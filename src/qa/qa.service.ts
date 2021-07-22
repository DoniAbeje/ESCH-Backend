import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RaiseQuestionDto } from './dto/raise-question.dto';
import { Answer, AnswerDocument } from './schema/answer.schema';
import { Question, QuestionDocument } from './schema/question.schema';

@Injectable()
export class QaService {
  constructor(
    @InjectModel(Question.name) public questionModel: Model<QuestionDocument>,
    @InjectModel(Answer.name) public answerModel: Model<AnswerDocument>,
  ) {}

  async raiseQuestion(raiseQuestionDto: RaiseQuestionDto) {
    return await this.questionModel.create(raiseQuestionDto);
  }
}
