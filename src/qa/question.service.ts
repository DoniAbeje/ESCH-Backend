import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RaiseQuestionDto } from './dto/raise-question.dto';
import { QuestionDoesNotExistException } from './exceptions/question-doesnot-exist.exception';
import { Question, QuestionDocument } from './schema/question.schema';
import { VoteService } from '../common/services/vote.service';
import { PaginationOption } from '../common/pagination-option';
import { QuestionQueryBuilder } from './query/question-query-builder';
import { UpdateQuestionDto } from './dto/update-question.dto';

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

  async updateQuestion(
    id: string,
    updateQuestionDto: UpdateQuestionDto,
  ): Promise<boolean> {
    const question = await this.exists(id);
    question.set(updateQuestionDto);
    await question.save();
    return true;
  }

  async deleteQuestion(questionId: string) {
    const question = await this.exists(questionId);
    return await question.delete();
  }

  async fetchAll(
    paginationOption: PaginationOption = PaginationOption.DEFAULT,
    tags: string[] = [],
    loggedInUserId = null,
    sort = false,
  ) {
    return (
      await new QuestionQueryBuilder(this.questionModel)
        .filterByTags(tags)
        .paginate(paginationOption)
        .populateAskedBy()
        .sort(sort)
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

  async search(
    paginationOption: PaginationOption,
    keywords: string,
    loggedInUserId: string = null,
  ) {
    return (
      await new QuestionQueryBuilder(this.questionModel)
        .search(keywords)
        .paginate(paginationOption)
        .populateAskedBy()
        .populateUserVoteFlag(loggedInUserId)
        .exec()
    ).all();
  }

  async count() {
    return await this.questionModel.countDocuments();
  }

  async exists(id: string, throwException = true) {
    const question = await this.questionModel.findById(id);
    if (!question && throwException) {
      throw new QuestionDoesNotExistException();
    }
    return question;
  }
}
