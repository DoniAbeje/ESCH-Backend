import { ExamQuestionService } from './exam-question.service';
import { ExamService } from './exam.service';
import { Body, Controller, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateExamDto } from './dto/create-exam.dto';
import { User } from '../common/decorators/user.decorator';
import { PostAuth } from '../common/decorators/post-auth.decorator';
import { GetAuth } from '../common/decorators/get-auth.decorator';
import { AddExamQuestionDto } from './dto/add-exam-question.dto';
import { PutAuth } from 'src/common/decorators/put-auth.decorator';
import { UpdateExamQuestionDto } from './dto/update-exam-question.dto';
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

  @GetAuth('/', 'Get all exams detail')
  async fetchAllExams() {
    return this.examService.fetchAll();
  }

  @GetAuth('/:examId', 'Get single exam')
  async fetchSingleExam(@Param('examId') examId: string) {
    return this.examService.findExamById(examId);
  }

  // ExamQuestion
  @PostAuth('/question', 'Add question to exam')
  async addExamQuestion(@Body() addExamQuestionDto: AddExamQuestionDto) {
    const examQuestion = await this.examQuestionService.addQuestionToExam(
      addExamQuestionDto,
    );

    return { _id: examQuestion._id };
  }

  @GetAuth('/:examId/question', 'Fetch Questions for single exam')
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
}
