import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RaiseQuestionDto } from './dto/raise-question.dto';
import { QuestionDoesNotExistException } from './exceptions/question-doesnot-exist.exception';
import { Question, QuestionDocument } from './schema/question.schema';
import * as mongoose from 'mongoose';
import { VoteService } from 'src/common/services/vote.service';
import { PaginationOption } from '../common/pagination-option';

@Injectable()
export class QuestionService extends VoteService {
  constructor(
    @InjectModel(Question.name) public questionModel: Model<QuestionDocument>,
  ) {
    super(questionModel);
  }

  async raiseQuestion(raiseQuestionDto: RaiseQuestionDto) {
    return await this.questionModel.create(raiseQuestionDto);
  }

  async fetchAll(
    paginationOption: PaginationOption = PaginationOption.getDefault(),
  ) {
    return await this.questionModel.aggregate([
      {
        $skip: paginationOption.offset,
      },
      {
        $limit: paginationOption.limit,
      },
      {
        $project: this.getProjection(),
      },
    ]);
  }

  async fetchOne(questionId: string) {
    return await this.questionModel.aggregate([
      {
        $match: { _id: mongoose.Types.ObjectId(questionId) },
      },
      {
        $project: this.getProjection(),
      },
    ]);
  }

  async exists(id: string, throwException = true) {
    const question = await this.questionModel.findById(id);
    if (!question && throwException) {
      throw new QuestionDoesNotExistException();
    }
    return question;
  }

  private getProjection() {
    return {
      question: 1,
      askedBy: 1,
      tags: 1,
      createdAt: 1,
      upvotes: { $size: '$upvotes' },
      downvotes: { $size: '$downvotes' },
    };
  }
}
