import { PaginationOption } from '../../common/pagination-option';
import * as mongoose from 'mongoose';
import { EnrolledExamDocument } from '../schema/enrolled-exam.schema';
import { ExecResult } from '../../qa/query/exec-result';

export class EnrolledExamQueryBuilder {
  private isBuilt = false;
  private aggregations: any[] = [];
  private paginationOption: PaginationOption;
  private examineeFilters: string[] = [];
  private idFilters: mongoose.Types.ObjectId[] = [];
  private shouldPopulateExaminee = false;
  private shouldPopulateExam = false;

  constructor(
    private enrolledExamModel: mongoose.Model<EnrolledExamDocument>,
  ) {}

  paginate(paginationOption: PaginationOption) {
    this.paginationOption = paginationOption;
    return this;
  }

  filterByExaminees(examinee: string[]) {
    this.examineeFilters = examinee;
    return this;
  }

  filterByIds(ids: string[]) {
    this.idFilters = ids.map((id) => mongoose.Types.ObjectId(id));
    return this;
  }

  populateExaminee(shouldPopulateExaminee = true) {
    this.shouldPopulateExaminee = shouldPopulateExaminee;
    return this;
  }

  populateExam(shouldPopulateExam = true) {
    this.shouldPopulateExam = shouldPopulateExam;
    return this;
  }

  build() {
    const match: EnrolledExamMatchQuery = this.processFilter();

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

    let enrolledExams = await this.enrolledExamModel.aggregate(
      this.aggregations,
    );
    enrolledExams = await this.processPopulate(enrolledExams);

    return new ExecResult(enrolledExams);
  }

  private processFilter(): EnrolledExamMatchQuery {
    const match: EnrolledExamMatchQuery = {};

    if (this.idFilters.length) {
      match._id = { $in: this.idFilters };
    }

    if (this.examineeFilters.length) {
      match.examinee = { $in: this.examineeFilters };
    }
    return match;
  }

  private async processPopulate(enrolledExams: any[]) {
    if (this.shouldPopulateExaminee) {
      enrolledExams = await this.enrolledExamModel.populate(enrolledExams, {
        path: 'examinee',
        select: ['_id', 'firstName', 'lastName', 'profilePicture'],
      });
    }
    if (this.shouldPopulateExam) {
      enrolledExams = await this.enrolledExamModel.populate(enrolledExams, {
        path: 'examId',
        select: ['_id', 'title', 'description', 'price', 'tags'],
      });
    }
    return enrolledExams;
  }
}

class EnrolledExamMatchQuery {
  _id?: any;
  examinee?: any;
}
