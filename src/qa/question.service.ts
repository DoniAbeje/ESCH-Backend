import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RaiseQuestionDto } from './dto/raise-question.dto';
import { QuestionDoesNotExistException } from './exceptions/question-doesnot-exist.exception';
import { Question, QuestionDocument } from './schema/question.schema';
import { VoteService } from '../common/services/vote.service';
import { PaginationOption } from '../common/pagination-option';
import { QuestionQueryBuilder } from './query/question-query-builder';

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
    paginationOption: PaginationOption = PaginationOption.DEFAULT,
    tags: string[] = [],
    loggedInUserId = null,
  ) {
    return (
      await new QuestionQueryBuilder(this.questionModel)
        .filterByTags(tags)
        .paginate(paginationOption)
        .populateAskedBy()
        .populateUserVoteFlag(loggedInUserId)
        .exec()
    ).all();
  }

  async fetchOne(questionId: string, loggedInUserId = null) {
    await this.exists(questionId);

    const result = await new QuestionQueryBuilder(this.questionModel)
      .filterByIds([questionId])
      .populateAskedBy()
      .populateUserVoteFlag(loggedInUserId)
      .exec();

    if (result.isEmpty()) {
      throw new QuestionDoesNotExistException();
    }
    return result.first();
  }

  async exists(id: string, throwException = true) {
    const question = await this.questionModel.findById(id);
    if (!question && throwException) {
      throw new QuestionDoesNotExistException();
    }
    return question;
  }
}
