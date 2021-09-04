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

  private projections = {
    firstName: 1,
    lastName: 1,
    phone: 1,
    profilePicture: 1,
    role: 1,
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
      $project: this.projections,
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

  private processFilter(): UserMatchQuery {
    const match: UserMatchQuery = {};

    if (this.idFilters.length) {
      match._id = { $in: this.idFilters };
    }

    return match;
  }
}

class UserMatchQuery {
  _id?: any;
}
