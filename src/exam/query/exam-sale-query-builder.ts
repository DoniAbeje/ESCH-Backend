import { PaginationOption } from '../../common/pagination-option';
import * as mongoose from 'mongoose';
import { ExecResult } from '../../qa/query/exec-result';
import { ExamSaleDocument } from '../schema/exam-sale.schema';

export class ExamSaleQueryBuilder {
  private isBuilt = false;
  private aggregations: any[] = [];
  private paginationOption: PaginationOption;
  private buyerFilters: string[] = [];
  private shouldPopulateExam = false;
  private shouldPopulateBuyer = false;

  constructor(private examSaleModel: mongoose.Model<ExamSaleDocument>) {}

  paginate(paginationOption: PaginationOption) {
    this.paginationOption = paginationOption;
    return this;
  }

  filterByBuyers(buyers: string[]) {
    this.buyerFilters = buyers;
    return this;
  }

  populateExam(shouldPopulateExam = true) {
    this.shouldPopulateExam = shouldPopulateExam;
    return this;
  }

  populateBuyer(shouldPopulateBuyer = true) {
    this.shouldPopulateBuyer = shouldPopulateBuyer;
    return this;
  }

  build() {
    const match: ExamSaleMatchQuery = this.processFilter();

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

    let examSales = await this.examSaleModel.aggregate(this.aggregations);
    examSales = await this.processPopulate(examSales);

    return new ExecResult(examSales);
  }

  private processFilter(): ExamSaleMatchQuery {
    const match: ExamSaleMatchQuery = {};

    if (this.buyerFilters.length) {
      match.buyer = { $in: this.buyerFilters };
    }
    return match;
  }

  private async processPopulate(examSales: any[]) {
    if (this.shouldPopulateExam) {
      examSales = await this.examSaleModel.populate(examSales, {
        path: 'exam',
        select: ['_id', 'title', 'description', 'price', 'tags'],
      });
    }
    if (this.shouldPopulateBuyer) {
      examSales = await this.examSaleModel.populate(examSales, {
        path: 'buyer',
        select: ['_id', 'firstName', 'lastName', 'profilePicture'],
      });
    }
    return examSales;
  }
}

class ExamSaleMatchQuery {
  buyer?: any;
}
