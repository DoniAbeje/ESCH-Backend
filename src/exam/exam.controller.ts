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
import { PutAuth } from 'src/common/decorators/put-auth.decorator';
import { UpdateExamQuestionDto } from './dto/update-exam-question.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { DeleteAuth } from '../common/decorators/delete-auth.decorator';
import { ApiPagination } from '../common/decorators/api-pagination.decorator';
import { Pagination } from '../common/decorators/pagination.decorator';
import { PaginationOption } from '../common/pagination-option';
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

  @ApiTags('Get all exams detail')
  @ApiPagination()
  @ApiQuery({ name: 'tags', type: [String], required: false })
  @ApiQuery({ name: 'authors', type: [String], required: false })
  @Get('/')
  async fetchAllExams(
    @Pagination() paginationOption: PaginationOption,
    @Query('tags', new ParseArrayPipe({ items: String, optional: true }))
    tags: string[] = [],
    @Query('authors', new ParseArrayPipe({ items: String, optional: true }))
    authors: string[] = [],
  ) {
    return this.examService.fetchAll(paginationOption, tags, authors);
  }

  @ApiTags('Get single exam')
  @Get('/:examId')
  async fetchSingleExam(@Param('examId') examId: string) {
    return this.examService.fetchOne(examId);
  }

  @DeleteAuth('/:examId', 'Delete exam')
  async deleteExam(@Param('examId') examId: string) {
    await this.examService.delete(examId);
  }

  @PostAuth('/question', 'Add question to exam')
  async addExamQuestion(@Body() addExamQuestionDto: AddExamQuestionDto) {
    const examQuestion = await this.examQuestionService.addQuestionToExam(
      addExamQuestionDto,
    );

    return { _id: examQuestion._id };
  }

  @ApiTags('Fetch Questions for single exam')
  @Get('/:examId/question')
  async fetchQuestionsForSingleExam(@Param('examId') examId: string) {
    return await this.examQuestionService.findByExamId(examId);
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
}
