import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaginationOption } from '../common/pagination-option';
import { EnrollForExamDto } from './dto/enroll-for-exam.dto';
import { ExamService } from './exam.service';
import { NotEnrolledException } from './exceptions/not-enrolled.exception';
import { EnrolledExamQueryBuilder } from './query/enrolled-exam-query-builder';
import {
  EnrolledExam,
  EnrolledExamDocument,
} from './schema/enrolled-exam.schema';

@Injectable()
export class ExamEnrollmentService {
  constructor(
    @InjectModel(EnrolledExam.name)
    public enrolledExamModel: Model<EnrolledExamDocument>,
    private examService: ExamService,
  ) {}

  async enroll(enrollForExamDto: EnrollForExamDto) {
    const exam = await this.examService.exists(enrollForExamDto.examId);

    if (exam.price > 0) {
      await this.userHasBoughtExam(
        enrollForExamDto.examId,
        enrollForExamDto.examinee,
        true,
      );
    }

    return this.enrolledExamModel.create(enrollForExamDto);
  }

  async userHasBoughtExam(
    examId: string,
    examinee: string,
    throwException: boolean,
  ) {
    // check if the user has already paid for it
    return true;
  }

  async fetchEnrolledExams(
    examinee,
    paginationOption: PaginationOption = PaginationOption.DEFAULT,
  ) {
    return (
      await new EnrolledExamQueryBuilder(this.enrolledExamModel)
        .paginate(paginationOption)
        .filterByExaminees([examinee])
        .populateExam()
        .exec()
    ).all();
  }

  async exists(examId, examinee, throwException = true) {
    const enrolledExam = await this.enrolledExamModel.findOne({
      examId,
      examinee,
    });

    if (!enrolledExam && throwException) {
      throw new NotEnrolledException();
    }

    return enrolledExam;
  }
}
