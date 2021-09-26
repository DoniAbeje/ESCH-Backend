import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaginationOption } from '../common/pagination-option';
import { EnrollForExamDto } from './dto/enroll-for-exam.dto';
import { ExamQuestionService } from './exam-question.service';
import { ExamService } from './exam.service';
import { AlreadyEnrolledException } from './exceptions/already-enrolled.exception';
import { ExamShouldBeBoughtException } from './exceptions/ExamShouldeBeBought.exception';
import { NotEnrolledException } from './exceptions/not-enrolled.exception';
import { EnrolledExamQueryBuilder } from './query/enrolled-exam-query-builder';
import { AnswerExamQuestionDto } from './dto/answer-exam-question.dto';

import {
  EnrolledExam,
  EnrolledExamDocument,
} from './schema/enrolled-exam.schema';
import { ExamReportDto } from './dto/exam-report.dto';

@Injectable()
export class ExamEnrollmentService {
  constructor(
    @InjectModel(EnrolledExam.name)
    public enrolledExamModel: Model<EnrolledExamDocument>,
    @Inject(forwardRef(() => ExamService)) private examService: ExamService,
    @Inject(forwardRef(() => ExamQuestionService))
    private examQuestionService: ExamQuestionService,
  ) {}

  async enroll(enrollForExamDto: EnrollForExamDto, checkPrice=true) {
    const exam = await this.examService.exists(enrollForExamDto.exam);
    const enrolled = await this.exists(
      enrollForExamDto.exam,
      enrollForExamDto.examinee,
      false,
    );

    if (enrolled) {
      throw new AlreadyEnrolledException();
    }

    if (checkPrice && exam.price > 0) {
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

  async submitAnswer(
    { questionId, answer }: AnswerExamQuestionDto,
    examinee: string,
  ) {
    // check if question exists
    const examQuestion = await this.examQuestionService.exists(questionId);
    const { examId } = examQuestion;

    // check if exam exists
    await this.examService.exists(examId);

    // check if enrollment exists
    const enrollment = await this.exists(examId, examinee);
    this.examQuestionService.checkForAnswerKeyPartOfChoice(
      examQuestion,
      answer,
    );

    // check if the question is submitted before
    const submittedBefore = await this.isAnsweredBefore(
      examId,
      examinee,
      questionId,
    );

    const isCorrect = answer === examQuestion.correctAnswer;

    if (submittedBefore) {
      await this.updateAnswer(enrollment._id, questionId, answer, isCorrect);
    } else {
      await this.addAnswer(enrollment._id, questionId, answer, isCorrect);
    }

    return enrollment;
  }

  async fetchUserExamReport(examinee) {
    const examReports = [];

    const enrolledExams = (
      await new EnrolledExamQueryBuilder(this.enrolledExamModel)
        .filterByExaminees([examinee])
        .populateExam()
        .exec()
    ).all();

    for (const enrolledExam of enrolledExams) {
      const examReport: any = {};

      examReport.exam = enrolledExam.exam;
      examReport.answersCount = enrolledExam.answers.length;
      examReport.questionsCount =
        await this.examQuestionService.countQuestionsInExam(enrolledExam.exam);
      examReport.correctAnswersCount = enrolledExam.answers.reduce(
        (prev, answer) => {
          answer.isCorrect ? prev++ : prev;
        },
        0,
      );

      examReports.push(examReport);
    }

    return { enrollmentsCount: enrolledExams.length, examReports };
  }

  private async addAnswer(
    enrollment: string,
    questionId: string,
    answer: string,
    isCorrectAnswer: boolean,
  ) {
    await this.enrolledExamModel.updateOne(
      { _id: enrollment },
      {
        $push: {
          answers: {
            question: questionId,
            answer: answer,
            isCorrect: isCorrectAnswer,
          },
        },
      },
    );
  }

  private async updateAnswer(
    enrollment: string,
    questionId: string,
    answer: string,
    isCorrectAnswer: boolean,
  ) {
    await this.enrolledExamModel.updateOne(
      { _id: enrollment, 'answers.question': questionId },
      {
        $set: {
          'answers.$.answer': answer,
          'answers.$.isCorrect': isCorrectAnswer,
        },
      },
    );
  }

  async isAnsweredBefore(exam, examinee, questionId): Promise<boolean> {
    return await this.enrolledExamModel.exists({
      exam,
      examinee,
      'answers.question': questionId,
    });
  }

  async count() {
    return await this.enrolledExamModel.countDocuments();
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
