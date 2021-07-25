import { ExamQuestionService } from './exam-question.service';
import { ExamService } from './exam.service';
import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Exam')
@Controller('exam')
export class ExamController {
  constructor(
    private examService: ExamService,
    private examQuestionService: ExamQuestionService,
  ) {}
}
