import { ExamQuestionService } from './exam-question.service';
import { ExamService } from './exam.service';
import { Body, Controller, Get, Param } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateExamDto } from './dto/create-exam.dto';
import { User } from '../common/decorators/user.decorator';
import { PostAuth } from '../common/decorators/post-auth.decorator';
import { AddExamQuestionDto } from './dto/add-exam-question.dto';
import { PutAuth } from '../common/decorators/put-auth.decorator';
import { UpdateExamQuestionDto } from './dto/update-exam-question.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { DeleteAuth } from '../common/decorators/delete-auth.decorator';
import { ApiPagination } from '../common/decorators/api-pagination.decorator';
import { Pagination } from '../common/decorators/pagination.decorator';
import { PaginationOption } from '../common/pagination-option';
import { QueryArray } from '../common/decorators/query-array.decorator';
import { EnrollForExamDto } from './dto/enroll-for-exam.dto';
import { GetAuth } from '../common/decorators/get-auth.decorator';
import { ExamEnrollmentService } from './exam-enrollment.service';
import { AnswerExamQuestionDto } from './dto/answer-exam-question.dto';
import { ExamSaleService } from './exam-sale.service';
@ApiTags('Exam')
@Controller('exam')
export class ExamController {
  constructor(
    private examService: ExamService,
    private examQuestionService: ExamQuestionService,
    private examEnrollmentService: ExamEnrollmentService,
    private examSaleService: ExamSaleService,
  ) {}

  @PostAuth('/', 'Create Exam')
  async createExam(@Body() createExamDto: CreateExamDto, @User() user) {
    createExamDto.preparedBy = user.id;

    const exam = await this.examService.createExam(createExamDto);
    return { _id: exam._id };
  }

  @PutAuth('/:examId', 'Update Exam')
  async updateExam(
    @Param('examId') examId: string,
    @Body() updateExamDto: UpdateExamDto,
  ) {
    await this.examService.updateExam(examId, updateExamDto);
  }

  @DeleteAuth('/:examId', 'Delete exam')
  async deleteExam(@Param('examId') examId: string) {
    await this.examService.delete(examId);
  }

  @ApiPagination('/', 'Get all exams detail')
  @ApiQuery({ name: 'tags', type: [String], required: false })
  @ApiQuery({ name: 'authors', type: [String], required: false })
  async fetchAllExams(
    @Pagination() paginationOption: PaginationOption,
    @QueryArray('tags')
    tags: string[] = [],
    @QueryArray('authors')
    authors: string[] = [],
  ) {
    return this.examService.fetchAll(paginationOption, tags, authors);
  }

  @GetAuth('/enrolled', 'Fetch enrolled exam for a user')
  async fetchEnrolledExams(
    @Pagination() paginationOption: PaginationOption,
    @User() user,
  ) {
    return this.examEnrollmentService.fetchEnrolledExams(
      user.id,
      paginationOption,
    );
  }

  @GetAuth('/orders', 'Fetch orders')
  async fetchOrders(@Pagination() paginationOption: PaginationOption) {
    return this.examSaleService.fetchAll(paginationOption);
  }

  @GetAuth('/my-orders', 'Fetch orders')
  async fetchLoggedInUsersOrders(
    @Pagination() paginationOption: PaginationOption,
    @User('id') userId,
  ) {
    return this.examSaleService.fetchAll(paginationOption, [userId]);
  }

  @GetAuth('/reports', 'Fetch users exam reports')
  async fetchUsersExamReport(@User('id') userId) {
    return this.examService.fetchUserExamReport(userId);
  }

  @ApiTags('Get single exam')
  @Get('/:examId')
  async fetchSingleExam(@Param('examId') examId: string) {
    return this.examService.fetchOne(examId);
  }

  @PostAuth('/question', 'Add question to exam')
  async addExamQuestion(@Body() addExamQuestionDto: AddExamQuestionDto) {
    const examQuestion = await this.examQuestionService.addQuestionToExam(
      addExamQuestionDto,
    );

    return { _id: examQuestion._id };
  }

  @PutAuth('question/:examQuestionId', 'Update Exam Question')
  async updateExamQuestion(
    @Param('examQuestionId') examQuestionId: string,
    @Body() updateExamQuestionDto: UpdateExamQuestionDto,
  ) {
    const examQuestion = await this.examQuestionService.updateExamQuestion(
      examQuestionId,
      updateExamQuestionDto,
    );

    return { _id: examQuestion._id };
  }

  @DeleteAuth('question/:examQuestionId', 'Delete Exam Question')
  async deleteExamQuestion(@Param('examQuestionId') examQuestionId: string) {
    await this.examQuestionService.delete(examQuestionId);
  }

  @ApiPagination('/:examId/question', 'Fetch Questions for single exam')
  async fetchQuestionsForSingleExam(
    @Pagination() paginationOption: PaginationOption,
    @Param('examId') examId: string,
  ) {
    return await this.examQuestionService.fetchAll(examId, paginationOption);
  }

  @ApiPagination(
    '/:examId/question/samples',
    'Fetch sample questions for single exam',
  )
  async fetchSampleQuestionsForSingleExam(
    @Pagination() paginationOption: PaginationOption,
    @Param('examId') examId: string,
  ) {
    return await this.examQuestionService.fetchSamples(
      paginationOption,
      examId,
    );
  }

  @PostAuth('/enroll', 'Enroll for an exam')
  async enrollForAnExam(
    @Body() enrollForExamDto: EnrollForExamDto,
    @User() user,
  ) {
    enrollForExamDto.examinee = user.id;

    const enrollment = await this.examEnrollmentService.enroll(
      enrollForExamDto,
    );

    return { _id: enrollment._id };
  }

  @PutAuth('/question/answer', 'Answer Exam Question')
  async answerExamQuestion(
    @Body() answerExamQuestionDto: AnswerExamQuestionDto,
    @User() user,
  ) {
    const enrolledExam = await this.examService.answerExamQuestion(
      answerExamQuestionDto,
      user.id,
    );
    return { _id: enrolledExam._id };
  }

  @PostAuth('/:examId/buy', 'Buy an exam')
  async buyExam(@Param('examId') examId: string, @User() user) {
    const examSale = await this.examSaleService.buy(examId, user.id);

    return { _id: examSale._id };
  }
}
