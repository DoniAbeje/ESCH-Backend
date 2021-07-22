import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Mongoose } from 'mongoose';
import { AnswerQuestionDto } from './dto/answer-question.dto';
import { RaiseQuestionDto } from './dto/raise-question.dto';
import { QuestionDoesNotExistException } from './exceptions/question-doesnot-exist.exception';
import { Answer, AnswerDocument } from './schema/answer.schema';
import { Question, QuestionDocument } from './schema/question.schema';
import  * as mongoose from 'mongoose'

@Injectable()
export class QaService {
  constructor(
    @InjectModel(Question.name) public questionModel: Model<QuestionDocument>,
    @InjectModel(Answer.name) public answerModel: Model<AnswerDocument>,
  ) {}

  async raiseQuestion(raiseQuestionDto: RaiseQuestionDto) {
    return await this.questionModel.create(raiseQuestionDto);
  }

  async findAllQuestions() {
    return await this.questionModel.aggregate([
      {
        $project: {
          question: 1,
          askedBy: 1,
          tags: 1,
          createdAt: 1,
          upvotes: { $size: '$upvotes' },
          downvotes: { $size: '$downvotes' },
        },
      },
    ]);
  }

  async findAnswersByQuestionId(questionId: string) {
    await this.findQuestionById(questionId);
    return await this.answerModel.aggregate([
      {
        $match: { question: mongoose.Types.ObjectId(questionId) },
      },
      {
        $project: {
          answer: 1,
          question: 1,
          answeredBy: 1,
          createdAt: 1,
          upvotes: { $size: '$upvotes' },
          downvotes: { $size: '$downvotes' },
        },
      },
    ]);
  }

  async answerQuestion(answerQuestionDto: AnswerQuestionDto) {
    await this.findQuestionById(answerQuestionDto.question);
    return this.answerModel.create(answerQuestionDto);
  }

  async findQuestionById(id: string) {
    const question = await this.questionModel.findById(id);
    if (!question) {
      throw new QuestionDoesNotExistException();
    }
    return question;
  }
}
