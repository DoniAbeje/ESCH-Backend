import { Exam, ExamDocument } from './schema/exam.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateExamDto } from './dto/create-exam.dto';
import { ExamDoesNotExistException } from './exceptions/exam-doesnot-exist.exception';
import { UpdateExamDto } from './dto/update-exam.dto';
import { PaginationOption } from '../common/pagination-option';
import { ExamQueryBuilder } from './query/exam-query-builder';
import {
  EnrolledExam,
  EnrolledExamDocument,
} from './schema/enrolled-exam.schema';
import { EnrollForExamDto } from './dto/enroll-for-exam.dto';

@Injectable()
export class ExamService {
  constructor(
    @InjectModel(Exam.name) public examModel: Model<ExamDocument>,
    @InjectModel(EnrolledExam.name)
    public enrolledExamModel: Model<EnrolledExamDocument>,
  ) {}

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

  async enroll(enrollForExamDto: EnrollForExamDto) {
    const exam = await this.exists(enrollForExamDto.examId);

    if (exam.price > 0) {
      await this.userHasBoughtExam(
        enrollForExamDto.examId,
        enrollForExamDto.userId,
        true,
      );
    }

    return this.enrolledExamModel.create(enrollForExamDto);
  }

  async userHasBoughtExam(
    examId: string,
    userId: string,
    throwException: boolean,
  ) {
    // check if the user has already paid for it
    return true;
  }

  async fetchEnrolledExams(userId) {
    // populate exam properties
    return this.enrolledExamModel.find({ userId });
  }

  async exists(examId: string) {
    const exam = await this.examModel.findById(examId);

    if (!exam) {
      throw new ExamDoesNotExistException();
    }

    return exam;
  }
}
