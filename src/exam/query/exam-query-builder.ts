import { PaginationOption } from '../../common/pagination-option';
import * as mongoose from 'mongoose';
import { Model } from 'mongoose';
import { ExamDocument } from '../schema/exam.schema';
import { ExecResult } from '../../qa/query/exec-result';

export class ExamQueryBuilder {
  private isBuilt = false;
  private aggregations: any[] = [];
  private paginationOption: PaginationOption;
  private tagFilters: string[] = [];
  private authorFilters: mongoose.Types.ObjectId[] = [];
  private idFilters: mongoose.Types.ObjectId[] = [];
  private searchFilter: string = '';
  private shouldPopulatePreparedBy = false;
  
  private userRatingPopulation = {
    shouldPopulate: false,
    userId: null,
  };

  private projections = {
    status: 1,
    tags: 1,
    samples: 1,
    price: 1,
    title: 1,
    description: 1,
    preparedBy: 1,
    createdAt: 1,
    ratingCount: { $size: '$ratings' },
    avgRating: { $ifNull: [{ $avg: '$ratings.rating' }, 0] },
  };
  constructor(private examModel: Model<ExamDocument>) {}

  paginate(paginationOption: PaginationOption) {
    this.paginationOption = paginationOption;
    return this;
  }

  filterByTags(tags: string[]) {
    this.tagFilters = tags;
    return this;
  }

  filterByAuthors(authors: string[]) {
    this.authorFilters = authors.map((id) => mongoose.Types.ObjectId(id));
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

  populatePreparedBy(shouldPopulatePreparedBy = true) {
    this.shouldPopulatePreparedBy = shouldPopulatePreparedBy;
    return this;
  }

  populateUserRating(userId: string, shouldPopulate = true) {
    this.userRatingPopulation.shouldPopulate = shouldPopulate;
    this.userRatingPopulation.userId = userId;
    return this;
  }

  build() {
    const match: ExamMatchQuery = this.processFilter();
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

    let answered = await this.examModel.aggregate(this.aggregations);
    answered = await this.processPopulate(answered);

    return new ExecResult(answered);
  }

  private processFilter(): ExamMatchQuery {
    const match: ExamMatchQuery = {};

    if (this.idFilters.length) {
      match._id = { $in: this.idFilters };
    }

    if (this.tagFilters.length) {
      match.tags = { $all: this.tagFilters };
    }

    if (this.hasSearchFilter()) {
      match.$text = { $search: this.searchFilter };
    }

    if (this.authorFilters.length) {
      match.preparedBy = { $in: this.authorFilters };
    }
    return match;
  }

  private preProcessProjection() {
    let tempProjections = this.projections;

    if (this.userRatingPopulation.shouldPopulate) {
      tempProjections = this.getUserRatingProjection(tempProjections);
    }
    return tempProjections;
  }

  private async processPopulate(answers: any[]) {
    if (this.shouldPopulatePreparedBy) {
      answers = await this.examModel.populate(answers, {
        path: 'preparedBy',
        select: ['_id', 'firstName', 'lastName', 'profilePicture'],
      });
    }
    return answers;
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

  private getUserRatingProjection(tempProjections) {
    const userRatingProjction = {
      userRating: {
        $ifNull: [
          {
            $first: {
              $filter: {
                input: '$ratings',
                as: 'r',
                cond: {
                  $eq: ['$$r.userId', this.userRatingPopulation.userId],
                },
              },
            },
          },
          null,
        ],
      },
    };
    tempProjections = { ...tempProjections, ...userRatingProjction };
    return tempProjections;
  }
}

class ExamMatchQuery {
  _id?: any;
  tags?: any;
  preparedBy?: any;
  $text?: any;
}
