import { Body, Controller, Get, Post, UseGuards, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
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

  @ApiTags('Raise Question')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('/')
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
    return this.questionService.findAll();
  }

  @ApiTags('Answer Question')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('/:questionId/answer')
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

  @ApiTags('Upvote Question')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('/:questionId/upvote')
  async upvote(
    @Param('questionId') questionId: string,
    @User('id') userId: string,
  ) {
    await this.questionService.upvote(questionId, userId);
  }

  @ApiTags('Down Question')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('/:questionId/downvote')
  async downvote(
    @Param('questionId') questionId: string,
    @User('id') userId: string,
  ) {
    await this.questionService.downvote(questionId, userId);
  }
}
