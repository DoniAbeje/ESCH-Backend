import { PaginationOption } from '../../common/pagination-option';
import * as mongoose from 'mongoose';
import { QuestionDocument } from '../schema/question.schema';
import { Model } from 'mongoose';
import { ExecResult } from './exec-result';

export class QuestionQueryBuilder {
  private isBuilt = false;
  private aggregations: any[] = [];
  private paginationOption: PaginationOption;
  private tagFilters: string[] = [];
  private idFilters: mongoose.Types.ObjectId[] = [];
  private searchFilter = '';
  private shouldPopulateAskedBy = false;

  private voteFlagPopulation = {
    shouldPopulate: false,
    userId: null,
  };

  private projections: any = {
    question: 1,
    askedBy: 1,
    tags: 1,
    createdAt: 1,
    upvotes: 1,
    downvotes: 1,
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

  search(keywords: string) {
    this.searchFilter = keywords;
    return this;
  }

  populateAskedBy(shouldPopulateAskedBy = true) {
    this.shouldPopulateAskedBy = shouldPopulateAskedBy;
    return this;
  }

  populateUserVoteFlag(userId: string, shouldPopulate = true) {
    this.voteFlagPopulation.shouldPopulate = shouldPopulate;
    this.voteFlagPopulation.userId = userId;

    return this;
  }

  build() {
    const match: QuestionMatchQuery = this.processFilter();
    const sort = this.processSorting();

    if (match != {}) {
      this.aggregations.push({
        $match: match,
      });
    }

    if (sort) {
      this.aggregations.push({
        $sort: sort,
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
      $project: this.preProcessProjection(),
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

    return new ExecResult(questions);
  }

  private preProcessProjection() {
    let tempProjections = this.projections;
    const { shouldPopulate, userId } = this.voteFlagPopulation;

    if (shouldPopulate) {
      tempProjections = {
        ...tempProjections,
        upvoted: {
          $in: [userId, '$upvotes'],
        },
        downvoted: {
          $in: [userId, '$downvotes'],
        },
      };
    }

    tempProjections = {
      ...tempProjections,
      upvotes: { $size: '$upvotes' },
      downvotes: { $size: '$downvotes' },
    };
    return tempProjections;
  }

  private processFilter(): QuestionMatchQuery {
    const match: QuestionMatchQuery = {};

    if (this.hasSearchFilter()) {
      match.$text = { $search: this.searchFilter };
    }

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

  private processSorting() {
    if (this.hasSearchFilter()) {
      return { score: { $meta: 'textScore' } };
    }
    return null;
  }

  private hasSearchFilter() {
    return this.searchFilter != '';
  }
}

class QuestionMatchQuery {
  _id?: any;
  tags?: any;
  $text?: any;
}
