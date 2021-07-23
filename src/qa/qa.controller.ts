import { Body, Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PostAuth } from 'src/utils/post-auth.decorator';
import { User } from 'src/utils/user.decorator';
import { AnswerService } from './answer.service';
import { AnswerQuestionDto } from './dto/answer-question.dto';
import { RaiseQuestionDto } from './dto/raise-question.dto';
import { QuestionService } from './question.service';

@ApiTags('Question and Answer')
@Controller('question')
export class QaController {
  constructor(
    private questionService: QuestionService,
    private answerService: AnswerService,
  ) {}

  @PostAuth('/', 'Raise Question')
  async raiseQuestion(
    @Body() raiseQuestionDto: RaiseQuestionDto,
    @User() user,
  ) {
    raiseQuestionDto.askedBy = user.id;
    const question = await this.questionService.raiseQuestion(raiseQuestionDto);
    return { _id: question._id };
  }

  @ApiTags('Fetch Questions')
  @Get('/')
  async fetchAllQuestions() {
    return this.questionService.fetchAll();
  }

  @ApiTags('Fetch Single Question')
  @Get('/:questionId')
  async fetchSingleQuestions(@Param('questionId') questionId: string) {
    return this.questionService.fetchOne(questionId);
  }

  @PostAuth('/:questionId/answer', 'Answer Question')
  async answerQuestion(
    @Body() answerQuestionDto: AnswerQuestionDto,
    @User() user,
    @Param('questionId') questionId: string,
  ) {
    answerQuestionDto.answeredBy = user.id;
    answerQuestionDto.question = questionId;
    const answer = await this.answerService.answerQuestion(answerQuestionDto);
    return { _id: answer._id };
  }

  @ApiTags('Fetch Answers for single question')
  @Get('/:questionId/answer')
  async fetchAnswersForSingleQuestions(
    @Param('questionId') questionId: string,
  ) {
    return await this.answerService.findByQuestionId(questionId);
  }

  @PostAuth('/:questionId/upvote', 'Upvote Question')
  async upvote(
    @Param('questionId') questionId: string,
    @User('id') userId: string,
  ) {
    await this.questionService.upvote(questionId, userId);
  }

  @PostAuth('/:questionId/downvote', 'Downvote Question')
  async downvote(
    @Param('questionId') questionId: string,
    @User('id') userId: string,
  ) {
    await this.questionService.downvote(questionId, userId);
  }

  @PostAuth('/:questionId/cancel-vote', 'Cancel vote')
  async cancelVote(
    @Param('questionId') questionId: string,
    @User('id') userId: string,
  ) {
    await this.questionService.cancelVote(questionId, userId);
  }
}
