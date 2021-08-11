import { PaginationOption } from '../../common/pagination-option';
import * as mongoose from 'mongoose';
import { Model } from 'mongoose';
import { ExecResult } from './exec-result';
import { AnswerDocument } from '../schema/answer.schema';

export class AnswerQueryBuilder {
  private isBuilt = false;
  private aggregations: any[] = [];
  private paginationOption: PaginationOption;
  private idFilters: mongoose.Types.ObjectId[] = [];
  private questionIdFilters: string[] = [];
  private shouldPopulateAnsweredBy = false;
  private projections = {
    answer: 1,
    question: 1,
    answeredBy: 1,
    createdAt: 1,
    upvotes: { $size: '$upvotes' },
    downvotes: { $size: '$downvotes' },
  };

  constructor(private answerModel: Model<AnswerDocument>) {}

  paginate(paginationOption: PaginationOption) {
    this.paginationOption = paginationOption;
    return this;
  }

  filterByIds(ids: string[]) {
    this.idFilters = ids.map((id) => mongoose.Types.ObjectId(id));
    return this;
  }

  filterByQuestionIds(ids: string[]) {
    this.questionIdFilters = ids
    return this;
  }

  populateAnsweredBy(shouldPopulateAnsweredBy = true) {
    this.shouldPopulateAnsweredBy = shouldPopulateAnsweredBy;
    return this;
  }

  build() {
    const match: AnswerMatchQuery = this.processFilter();

    if (match != {}) {
      this.aggregations.push({
        $match: match,
      });
    }
    // limit
    if (this.paginationOption) {
      this.aggregations.push({
        $skip: this.paginationOption.offset,
      });

      this.aggregations.push({
        $limit: this.paginationOption.limit,
      });
    }
    // projection
    this.aggregations.push({
      $project: this.projections,
    });
    this.isBuilt = true;
    return this.aggregations;
  }

  async exec() {
    if (!this.isBuilt) {
      this.build();
    }

    let answered = await this.answerModel.aggregate(this.aggregations);
    answered = await this.processPopulate(answered);

    return new ExecResult(answered);
  }

  private processFilter(): AnswerMatchQuery {
    const match: AnswerMatchQuery = {};

    if (this.idFilters.length) {
      match._id = { $in: this.idFilters };
    }

    if (this.questionIdFilters.length) {
      match.question = { $in: this.questionIdFilters };
    }

    return match;
  }

  private async processPopulate(answers: any[]) {
    if (this.shouldPopulateAnsweredBy) {
      answers = await this.answerModel.populate(answers, {
        path: 'answeredBy',
        select: ['_id', 'firstName', 'lastName', 'profilePicture'],
      });
    }
    return answers;
  }
}

class AnswerMatchQuery {
  _id?: any;
  question?: any;
}
