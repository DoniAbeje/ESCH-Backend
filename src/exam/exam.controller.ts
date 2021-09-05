import { ExamQuestionService } from './exam-question.service';
import { ExamService } from './exam.service';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseArrayPipe,
  Query,
} from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateExamDto } from './dto/create-exam.dto';
import { User } from '../common/decorators/user.decorator';
import { PostAuth } from '../common/decorators/post-auth.decorator';
import { GetAuth } from '../common/decorators/get-auth.decorator';
import { AddExamQuestionDto } from './dto/add-exam-question.dto';
import { PutAuth } from '../common/decorators/put-auth.decorator';
import { UpdateExamQuestionDto } from './dto/update-exam-question.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { DeleteAuth } from '../common/decorators/delete-auth.decorator';
import { ApiPagination } from '../common/decorators/api-pagination.decorator';
import { Pagination } from '../common/decorators/pagination.decorator';
import { PaginationOption } from '../common/pagination-option';
import { QueryArray } from '../common/decorators/query-array.decorator';
import { RateDto } from '../common/dto/rate.dto';
import { CancelRateDto } from '../common/dto/cancel-rate.dto';
@ApiTags('Exam')
@Controller('exam')
export class ExamController {
  constructor(
    private examService: ExamService,
    private examQuestionService: ExamQuestionService,
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
    keywords: string = '',
  ) {
    return this.examService.search(paginationOption, keywords);
  }

  @ApiTags('Get single exam')
  @Get('/:examId')
  async fetchSingleExam(
    @Param('examId') examId: string,
    @User('id') loggedInUserId,
  ) {
    return this.examService.fetchOne(examId, loggedInUserId);
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

  @PostAuth('/rate', 'Rate exam')
  async rateExam(@Body() rateDto: RateDto, @User('id') userId) {
    rateDto.userId = userId;
    await this.examService.rate(rateDto);
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
