import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaginationOption } from '../common/pagination-option';
import { EnrollForExamDto } from './dto/enroll-for-exam.dto';
import { ExamService } from './exam.service';
import { AlreadyEnrolledException } from './exceptions/already-enrolled.exception';
import { ExamShouldBeBoughtException } from './exceptions/ExamShouldeBeBought.exception';
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
    @Inject(forwardRef(() => ExamService)) private examService: ExamService,
  ) {}

  async enroll(enrollForExamDto: EnrollForExamDto) {
    const exam = await this.examService.exists(enrollForExamDto.exam);
    const enrolled = await this.exists(enrollForExamDto.exam, enrollForExamDto.examinee, false);

    if (enrolled) {
      throw new AlreadyEnrolledException();
    }

    if(exam.price > 0){
      throw new ExamShouldBeBoughtException();
    }

    return this.enrolledExamModel.create(enrollForExamDto);
  }


  async fetchEnrolledExams(
    examinee: string,
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

  async answerExamQuestion(
    exam: string,
    examinee: string,
    questionId: string,
    answer: string,
    correctAnswer: string,
  ) {
    const enrolledExam = await this.exists(exam, examinee);
    const enrolledExamWithQuestion = await this.enrolledExamModel.findOne({
      exam,
      examinee,
      'answers.question': questionId,
    });

    if (enrolledExamWithQuestion) {
      await this.enrolledExamModel.updateOne(
        { _id: enrolledExam._id, 'answers.question': questionId },
        { $set: { 'answers.$.answer': answer } },
      );

      const wasCorrectAnswer = enrolledExamWithQuestion.answers.some((ans) => {
        return ans.question == questionId && ans.answer == correctAnswer;
      });

      if (wasCorrectAnswer) {
        await enrolledExam.updateOne({ $inc: { correctAnswerCount: -1 } });
      }
    } else {
      await this.enrolledExamModel.updateOne(
        { _id: enrolledExam._id },
        { $push: { answers: { question: questionId, answer: answer } } },
      );
    }

    if (answer == correctAnswer) {
      await enrolledExam.updateOne({ $inc: { correctAnswerCount: 1 } });
    }

    return enrolledExam;
  }

  async exists(exam: string, examinee: string, throwException = true) {
    const enrolledExam = await this.enrolledExamModel.findOne({
      exam,
      examinee,
    });

    if (!enrolledExam && throwException) {
      throw new NotEnrolledException();
    }

    return enrolledExam;
  }
}
