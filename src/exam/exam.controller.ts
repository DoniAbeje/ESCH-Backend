import { ExamQuestionService } from './exam-question.service';
import { ExamService } from './exam.service';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
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
import { ExamSaleStatus } from './schema/exam-sale.schema';
import { ExamRecommendationService } from './exam-recommendation.service';
import { RateDto } from '../common/dto/rate.dto';
import { CancelRateDto } from '../common/dto/cancel-rate.dto';
import { TagScoreOption } from '../common/tag-score-option';
import { UserRole } from '../user/schemas/user.schema';
@ApiTags('Exam')
@Controller('exam')
export class ExamController {
  constructor(
    private examService: ExamService,
    private examQuestionService: ExamQuestionService,
    private examEnrollmentService: ExamEnrollmentService,
    private examSaleService: ExamSaleService,
    private examRecommendationService: ExamRecommendationService,
  ) {}

  @PostAuth('/', 'Create Exam', [UserRole.INSTRUCTOR, UserRole.ADMIN])
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

  @DeleteAuth('/:examId', 'Delete exam', [UserRole.INSTRUCTOR, UserRole.ADMIN])
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
    @User('id') loggedInUserId,
  ) {
    return this.examService.fetchAll(
      paginationOption,
      tags,
      authors,
      loggedInUserId,
    );
  }

  @ApiPagination('/search', 'Search Exams')
  @ApiQuery({ name: 'keywords', type: String, required: false })
  async searchQuestions(
    @Pagination() paginationOption: PaginationOption,
    @Query('keywords')
    keywords = '',
  ) {
    return this.examService.search(paginationOption, keywords);
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

  @GetAuth('/instructor-report', 'Fetch report for instructor',[UserRole.INSTRUCTOR])
  async getInstructorReport(@User('id') userId) {
    return this.examEnrollmentService.fetchInstructorReport(userId);
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
    return this.examEnrollmentService.fetchUserExamReport(userId);
  }

  @ApiTags('Payment confirmation callback')
  @Post('/payment/callback')
  async confirmPayment(@Query('exam_sale_id') examSaleId) {
    const status = ExamSaleStatus.COMPLETE;
    return this.examSaleService.onPaymentStatusChanged(examSaleId, status);
  }

  @GetAuth('/recommended', 'Fetch recommended exams')
  async fetchRecommendedExams(
    @Pagination() paginationOption: PaginationOption,
    @User('id') userId,
  ) {
    return this.examRecommendationService.fetchExams(userId, paginationOption);
  }

  @ApiTags('Get single exam')
  @Get('/:examId')
  async fetchSingleExam(
    @Param('examId') examId: string,
    @User('id') loggedInUserId,
  ) {
    return this.examService.fetchOne(examId, loggedInUserId);
  }

  @PostAuth('/question', 'Add question to exam', [
    UserRole.INSTRUCTOR,
    UserRole.ADMIN,
  ])
  async addExamQuestion(@Body() addExamQuestionDto: AddExamQuestionDto) {
    const examQuestion = await this.examQuestionService.addQuestionToExam(
      addExamQuestionDto,
    );

    return { _id: examQuestion._id };
  }

  @PutAuth('/question/answer', 'Answer Exam Question')
  async answerExamQuestion(
    @Body() answerExamQuestionDto: AnswerExamQuestionDto,
    @User('id') userId,
  ) {
    const enrolledExam = await this.examEnrollmentService.submitAnswer(
      answerExamQuestionDto,
      userId,
    );
    return { _id: enrolledExam._id };
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

  @DeleteAuth('question/:examQuestionId', 'Delete Exam Question', [
    UserRole.INSTRUCTOR,
    UserRole.ADMIN,
  ])
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

  @PostAuth('/:examId/buy', 'Buy an exam')
  async buyExam(@Param('examId') examId: string, @User() user) {
    const result = await this.examSaleService.buy(examId, user.id);

    return result;
  }

  @ApiPagination('/similar/:examId', 'Fetch Similar Exams For a Given Exam')
  async fetchSimilarExams(
    @Pagination() paginationOption: PaginationOption,
    @Param('examId') examId: string,
  ) {
    return this.examRecommendationService.fetchSimilarExams(
      examId,
      paginationOption,
    );
  }

  @PostAuth('/rate', 'Rate exam')
  async rateExam(@Body() rateDto: RateDto, @User('id') userId) {
    rateDto.userId = userId;
    await this.examService.rate(rateDto);
    // update score value
    await this.examRecommendationService.updateUserPreference(
      userId,
      rateDto.rateableResourceId,
      rateDto.rating <= 2
        ? -1 * TagScoreOption.DEFAULT_SECONDARY_SCORE_INC
        : TagScoreOption.DEFAULT_PRIMARY_SCORE_INC,
    );
  }

  @PostAuth('/cancel-rate', 'Cancel exam rating')
  async cancelExamRating(
    @Body() cancelRateDto: CancelRateDto,
    @User('id') userId,
  ) {
    cancelRateDto.userId = userId;
    await this.examService.cancelRate(cancelRateDto);
  }
}
