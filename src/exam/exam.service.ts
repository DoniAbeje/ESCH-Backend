import { Exam, ExamDocument } from './schema/exam.schema';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateExamDto } from './dto/create-exam.dto';
import { ExamDoesNotExistException } from './exceptions/exam-doesnot-exist.exception';
import { UpdateExamDto } from './dto/update-exam.dto';
import { PaginationOption } from '../common/pagination-option';
import { ExamQueryBuilder } from './query/exam-query-builder';
import { ExamQuestionService } from './exam-question.service';
import { ExamEnrollmentService } from './exam-enrollment.service';
import { QuestionDoesNotBelongToExamException } from './exceptions/question-doesnot-belong-to-exam.exception';
import { AnswerExamQuestionDto } from './dto/answer-exam-question.dto';
import { ExamReportDto } from './dto/exam-report.dto';

@Injectable()
export class ExamService {
  constructor(
    @InjectModel(Exam.name) public examModel: Model<ExamDocument>,
    @Inject(forwardRef(() => ExamQuestionService))
    private examQuestionService: ExamQuestionService,
    @Inject(forwardRef(() => ExamEnrollmentService))
    private examEnrollmentService: ExamEnrollmentService,
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

  async fetchUserExamReport(examinee) {
    let examTakenCount = 0;
    const examReports = [];

    const enrolledExams = await this.examEnrollmentService.fetchEnrolledExams(
      examinee,
      null,
    );

    for (const enrolledExam of enrolledExams) {
      const examReport: ExamReportDto = {};

      examReport.noOfAnsweredQuestion = enrolledExam.answers.length;
      examReport.noOfQuestion =
        await this.examQuestionService.countQuestionsInExam(enrolledExam.exam);
      examReport.noOfCorrectAnswers = enrolledExam.correctAnswerCount;

      examReports.push(examReport);
      examTakenCount++;
    }

    return { totalNoOfExamsTaken: examTakenCount, examReports };
  }

  async delete(examId: string) {
    const exam = await this.exists(examId);
    return await exam.delete();
  }

  async answerExamQuestion(
    answerExamQuestionDto: AnswerExamQuestionDto,
    userId: string,
  ) {
    await this.exists(answerExamQuestionDto.examId);

    const examQuestion = await this.examQuestionService.exists(
      answerExamQuestionDto.questionId,
    );

    if (examQuestion.examId != answerExamQuestionDto.examId) {
      throw new QuestionDoesNotBelongToExamException();
    }

    this.examQuestionService.checkForCorrectAnswer(
      examQuestion,
      answerExamQuestionDto.answer,
    );

    return this.examEnrollmentService.answerExamQuestion(
      answerExamQuestionDto.examId,
      userId,
      answerExamQuestionDto.questionId,
      answerExamQuestionDto.answer,
      examQuestion.correctAnswer,
    );
  }

  async exists(examId: string, throwException = true) {
    const exam = await this.examModel.findById(examId);

    if (!exam && throwException) {
      throw new ExamDoesNotExistException();
    }

    return exam;
  }
}
