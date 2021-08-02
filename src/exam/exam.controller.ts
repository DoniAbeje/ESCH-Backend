import { ExamQuestionService } from './exam-question.service';
import { ExamService } from './exam.service';
import { Body, Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateExamDto } from './dto/create-exam.dto';
import { User } from 'src/utils/user.decorator';
import { PostAuth } from 'src/utils/post-auth.decorator';

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
}
