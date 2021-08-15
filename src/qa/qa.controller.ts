import { Body, Controller, Get, Param, ParseArrayPipe, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { PostAuth } from '../common/decorators/post-auth.decorator';
import { User } from '../common/decorators/user.decorator';
import { ApiPagination } from '../common/decorators/api-pagination.decorator';
import { Pagination } from '../common/decorators/pagination.decorator';
import { PaginationOption } from '../common/pagination-option';
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
  @ApiPagination()
  @ApiQuery({name: 'tags', type: [String], required: false})
  @Get('/')
  async fetchAllQuestions(
    @Pagination() paginationOption: PaginationOption,
    @Query('tags', new ParseArrayPipe({ items: String, optional: true })) tags: string[] = [],
  ) {
    return this.questionService.fetchAll(paginationOption, tags);
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
  @ApiPagination()
  @Get('/:questionId/answer')
  async fetchAnswersForSingleQuestions(
    @Param('questionId') questionId: string,
    @Pagination() paginationOption: PaginationOption,
  ) {
    return await this.answerService.findByQuestionId(
      questionId,
      paginationOption,
    );
  }

  @PostAuth('/:questionId/upvote', 'Upvote question')
  async upvoteQuestion(
    @Param('questionId') questionId: string,
    @User('id') userId: string,
  ) {
    await this.questionService.upvote(questionId, userId);
  }

  @PostAuth('/:questionId/downvote', 'Downvote question')
  async downvoteQuestion(
    @Param('questionId') questionId: string,
    @User('id') userId: string,
  ) {
    await this.questionService.downvote(questionId, userId);
  }

  @PostAuth('/:questionId/cancel-vote', 'Cancel question vote')
  async cancelQuestionVote(
    @Param('questionId') questionId: string,
    @User('id') userId: string,
  ) {
    await this.questionService.cancelVote(questionId, userId);
  }

  
  @PostAuth('/answer/:answerId/upvote', 'Upvote answer')
  async upvoteAnswer(
    @Param('answerId') answerId: string,
    @User('id') userId: string,
  ) {
    await this.answerService.upvote(answerId, userId);
  }

    
  @PostAuth('/answer/:answerId/downvote', 'Downvote answer')
  async downAnswer(
    @Param('answerId') answerId: string,
    @User('id') userId: string,
  ) {
    await this.answerService.downvote(answerId, userId);
  }

  @PostAuth('/answer/answerId:/cancel-vote', 'Cancel answer vote')
  async cancelAnswerVote(
    @Param('answerId') answerId: string,
    @User('id') userId: string,
  ) {
    await this.answerService.cancelVote(answerId, userId);
  }
}
