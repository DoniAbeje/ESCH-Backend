import { PaginationOption } from '../../common/pagination-option';
import * as mongoose from 'mongoose';
import { Model } from 'mongoose';
import { ExecResult } from '../../qa/query/exec-result';
import { ExamQuestionDocument } from '../schema/exam-question.schema';

export class ExamQuestionQueryBuilder {
  private isBuilt = false;
  private aggregations: any[] = [];
  private paginationOption: PaginationOption;
  private idFilters: mongoose.Types.ObjectId[] = [];
  private examFilters: mongoose.Types.ObjectId[] = [];

  constructor(private examQuestionModel: Model<ExamQuestionDocument>) {}

  paginate(paginationOption: PaginationOption) {
    this.paginationOption = paginationOption;
    return this;
  }

  filterByIds(ids: string[]) {
    this.idFilters = ids.map((id) => mongoose.Types.ObjectId(id));
    return this;
  }

  filterByExam(ids: string[]) {
    this.examFilters = ids.map((id) => mongoose.Types.ObjectId(id));
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

    const examQuestions = await this.examQuestionModel.aggregate(
      this.aggregations,
    );
    return new ExecResult(examQuestions);
  }

  private processFilter(): ExamMatchQuery {
    const match: ExamMatchQuery = {};

    if (this.idFilters.length) {
      match._id = { $in: this.idFilters };
    }

    if (this.examFilters.length) {
      match.examId = { $in: this.examFilters };
    }
    return match;
  }
}

class ExamMatchQuery {
  _id?: any;
  examId?: any;
}
