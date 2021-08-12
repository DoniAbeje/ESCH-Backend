import { ExamQuestionService } from './exam-question.service';
import { ExamService } from './exam.service';
import { Body, Controller, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateExamDto } from './dto/create-exam.dto';
import { User } from '../common/decorators/user.decorator';
import { PostAuth } from '../common/decorators/post-auth.decorator';
import { GetAuth } from '../common/decorators/get-auth.decorator';
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
}
