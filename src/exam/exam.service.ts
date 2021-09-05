import { Exam, ExamDocument } from './schema/exam.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateExamDto } from './dto/create-exam.dto';
import { ExamDoesNotExistException } from './exceptions/exam-doesnot-exist.exception';
import { UpdateExamDto } from './dto/update-exam.dto';
import { PaginationOption } from '../common/pagination-option';
import { ExamQueryBuilder } from './query/exam-query-builder';
import { RateService } from '../common/services/rate.service';

@Injectable()
export class ExamService extends RateService {
  constructor(@InjectModel(Exam.name) public examModel: Model<ExamDocument>) {
    super(examModel);
  }

  async createExam(createExamDto: CreateExamDto) {
    return this.examModel.create(createExamDto);
  }

  async updateExam(examId: string, updateExamDto: UpdateExamDto) {
    const exam = await this.exists(examId);
    return exam.update(updateExamDto);
  }

  async fetchAll(
    paginationOption: PaginationOption = PaginationOption.DEFAULT,
    tags: string[] = [],
    authors: string[] = [],
  ) {
    return (
      await new ExamQueryBuilder(this.examModel)
        .paginate(paginationOption)
        .filterByTags(tags)
        .filterByAuthors(authors)
        .populatePreparedBy()
        .exec()
    ).all();
  }

  async fetchOne(examId: string) {
    const result = await new ExamQueryBuilder(this.examModel)
      .filterByIds([examId])
      .populatePreparedBy()
      .exec();
    if (result.isEmpty()) {
      throw new ExamDoesNotExistException();
    }
    return result.first();
  }

  async delete(examId: string) {
    const exam = await this.exists(examId);
    return await exam.delete();
  }

  async search(paginationOption: PaginationOption, keywords: string) {
    return (
      await new ExamQueryBuilder(this.examModel)
        .search(keywords)
        .paginate(paginationOption)
        .populatePreparedBy()
        .exec()
    ).all();
  }

  async exists(examId: string, throwException = true) {
    const exam = await this.examModel.findById(examId);

    if (!exam && throwException) {
      throw new ExamDoesNotExistException();
    }

    return exam;
  }
}
