import { PaginationOption } from '../../common/pagination-option';
import * as mongoose from 'mongoose';
import { Model } from 'mongoose';
import { ExecResult } from '../../qa/query/exec-result';
import { UserDocument } from '../schemas/user.schema';

export class UserQuestionQueryBuilder {
  private isBuilt = false;
  private aggregations: any[] = [];
  private paginationOption: PaginationOption;
  private idFilters: mongoose.Types.ObjectId[] = [];

  private userRatingPopulation = {
    shouldPopulate: false,
    userId: null,
  };

  private projections = {
    firstName: 1,
    lastName: 1,
    phone: 1,
    profilePicture: 1,
    role: 1,
    preferredTags: 1,
    ratingCount: { $size: '$ratings' },
    avgRating: { $ifNull: [{ $avg: '$ratings.rating' }, 0] },
  };

  constructor(private userModel: Model<UserDocument>) {}

  paginate(paginationOption: PaginationOption) {
    this.paginationOption = paginationOption;
    return this;
  }

  filterByIds(ids: string[]) {
    this.idFilters = ids.map((id) => mongoose.Types.ObjectId(id));
    return this;
  }

  populateUserRating(userId: string, shouldPopulate = true) {
    this.userRatingPopulation.shouldPopulate = shouldPopulate;
    this.userRatingPopulation.userId = userId;
    return this;
  }

  build() {
    const match: UserMatchQuery = this.processFilter();

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
      $project: this.preProcessProjection(),
    });
    this.isBuilt = true;
    return this.aggregations;
  }

  async exec() {
    if (!this.isBuilt) {
      this.build();
    }

    const users = await this.userModel.aggregate(this.aggregations);
    return new ExecResult(users);
  }

  private preProcessProjection() {
    let tempProjections = this.projections;

    if (this.userRatingPopulation.shouldPopulate) {
      tempProjections = this.getUserRatingProjection(tempProjections);
    }
    return tempProjections;
  }

  private processFilter(): UserMatchQuery {
    const match: UserMatchQuery = {};

    if (this.idFilters.length) {
      match._id = { $in: this.idFilters };
    }

    return match;
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

class UserMatchQuery {
  _id?: any;
}
