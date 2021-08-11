import { PaginationOption } from '../../common/pagination-option';
import * as mongoose from 'mongoose';
import { QuestionDocument } from '../schema/question.schema';
import { Model } from 'mongoose';
import { QuestionExecResult } from './question-exec-result';

export class QuestionQueryBuilder {
  private isBuilt = false;
  private aggregations: any[] = [];
  private paginationOption: PaginationOption;
  private tagFilters: string[] = [];
  private idFilters: mongoose.Types.ObjectId[] = [];
  private shouldPopulateAskedBy = false;
  private projections = {
    question: 1,
    askedBy: 1,
    tags: 1,
    createdAt: 1,
    upvotes: { $size: '$upvotes' },
    downvotes: { $size: '$downvotes' },
  };

  constructor(private questionModel: Model<QuestionDocument>) {}

  paginate(paginationOption: PaginationOption) {
    this.paginationOption = paginationOption;
    return this;
  }

  filterByTags(tags: string[]) {
    this.tagFilters = tags;
    return this;
  }

  filterByIds(ids: string[]) {
    this.idFilters = ids.map((id) => mongoose.Types.ObjectId(id));
    return this;
  }

  populateAskedBy(shouldPopulateAskedBy = true) {
    this.shouldPopulateAskedBy = shouldPopulateAskedBy;
    return this;
  }

  build() {
    const match: QuestionMatchQuery = this.processFilter();

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

    let questions = await this.questionModel.aggregate(this.aggregations);
    questions = await this.processPopulate(questions);

    return new QuestionExecResult(questions);
  }

  private processFilter(): QuestionMatchQuery {
    const match: QuestionMatchQuery = {};

    if (this.idFilters.length) {
      match._id = { $in: this.idFilters };
    }

    if (this.tagFilters.length) {
      match.tags = { $all: this.tagFilters };
    }
    return match;
  }

  private async processPopulate(questions: any[]) {
    if (this.shouldPopulateAskedBy) {
      questions = await this.questionModel.populate(questions, {
        path: 'askedBy',
        select: ['_id', 'firstName', 'lastName', 'profilePicture'],
      });
    }
    return questions;
  }
}

class QuestionMatchQuery {
  _id?: any;
  tags?: any;
}
