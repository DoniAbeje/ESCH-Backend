import { Injectable } from '@nestjs/common';
import { ExamEnrollmentService } from './exam/exam-enrollment.service';
import { ExamQuestionService } from './exam/exam-question.service';
import { ExamSaleService } from './exam/exam-sale.service';
import { ExamService } from './exam/exam.service';
import { ExamSaleStatus } from './exam/schema/exam-sale.schema';
import { AnswerService } from './qa/answer.service';
import { QuestionService } from './qa/question.service';
import { UserRole } from './user/schemas/user.schema';
import { UserService } from './user/user.service';

@Injectable()
export class AppService {
  constructor(
    private userService: UserService,
    private examService: ExamService,
    private examSaleService: ExamSaleService,
    private questionService: QuestionService,
    private answerService: AnswerService,
    private enrollmentService: ExamEnrollmentService,
    private examQuestionService: ExamQuestionService,
  ) {}
  async getStat() {
    const admins = await this.userService.count(UserRole.ADMIN);
    const students = await this.userService.count(UserRole.STUDENT);
    const instructors = await this.userService.count(UserRole.INSTRUCTOR);

    const user = { admins, students, instructors };

    const questions = await this.questionService.count();
    const answers = await this.answerService.count();

    const qa = { questions, answers };

    const exams = await this.examService.count();
    const examQuestions = await this.examQuestionService.count();
    const enrollments = await this.enrollmentService.count();

    const exam = { exams, questions: examQuestions, enrollments };

    const pending = await this.examSaleService.count(ExamSaleStatus.PENDING);
    const canceled = await this.examSaleService.count(ExamSaleStatus.CANCELED);
    const completed = await this.examSaleService.count(ExamSaleStatus.COMPLETE);

    const order = { pending, canceled, completed };

    const result = {
      user,
      qa,
      exam,
      order,
    };
    return result;
  }
}
