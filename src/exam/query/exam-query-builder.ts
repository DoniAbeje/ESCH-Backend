import { PaginationOption } from '../../common/pagination-option';
import * as mongoose from 'mongoose';
import { Model } from 'mongoose';
import { ExamDocument } from '../schema/exam.schema';
import { ExecResult } from '../../qa/query/exec-result';

export class ExamQueryBuilder {
  private isBuilt = false;
  private aggregations: any[] = [];
  private paginationOption: PaginationOption;
  private idFilters: mongoose.Types.ObjectId[] = [];
  private shouldPopulatePreparedBy = false;


  constructor(private examModel: Model<ExamDocument>) {}

  paginate(paginationOption: PaginationOption) {
    this.paginationOption = paginationOption;
    return this;
  }

  filterByIds(ids: string[]) {
    this.idFilters = ids.map((id) => mongoose.Types.ObjectId(id));
    return this;
  }


  populatePreparedBy(shouldPopulatePreparedBy = true) {
    this.shouldPopulatePreparedBy = shouldPopulatePreparedBy;
    return this;
  }

  build() {
    const match: ExamMatchQuery = this.processFilter();

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

    return match;
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
}

class ExamMatchQuery {
  _id?: any;
}
