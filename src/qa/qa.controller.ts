import {
  Body,
  Controller,
  Get,
  Param,
  ParseArrayPipe,
  Query,
} from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { PostAuth } from '../common/decorators/post-auth.decorator';
import { User } from '../common/decorators/user.decorator';
import { ApiPagination } from '../common/decorators/api-pagination.decorator';
import { Pagination } from '../common/decorators/pagination.decorator';
import { QueryArray } from '../common/decorators/query-array.decorator';
import { PaginationOption } from '../common/pagination-option';
import { AnswerService } from './answer.service';
import { AnswerQuestionDto } from './dto/answer-question.dto';
import { RaiseQuestionDto } from './dto/raise-question.dto';
import { QuestionService } from './question.service';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { PutAuth } from '../common/decorators/put-auth.decorator';
import { DeleteAuth } from '../common/decorators/delete-auth.decorator';

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

  @ApiPagination('/', 'Fetch Questions')
  @ApiQuery({ name: 'tags', type: [String], required: false })
  async fetchAllQuestions(
    @Pagination() paginationOption: PaginationOption,
    @QueryArray('tags')
    tags: string[] = [],
    @User('id') userId,
  ) {
    return this.questionService.fetchAll(paginationOption, tags, userId);
  }

  @ApiPagination('/search', 'Search Questions')
  @ApiQuery({ name: 'keywords', type: String, required: false })
  async searchQuestions(
    @Pagination() paginationOption: PaginationOption,
    @Query('keywords')
    keywords = '',
    @User('id') userId,
  ) {
    return this.questionService.search(paginationOption, keywords, userId);
  }

  @ApiTags('Fetch Single Question')
  @Get('/:questionId')
  async fetchSingleQuestions(
    @Param('questionId') questionId: string,
    @User('id') userId,
  ) {
    return this.questionService.fetchOne(questionId, userId);
  }

  @PutAuth('/:questionId', 'Update Question')
  async updateQuestion(
    @Body() updateQuestionDto: UpdateQuestionDto,
    @User() user,
    @Param('questionId') questionId: string,
  ) {
    await this.questionService.updateQuestion(questionId, updateQuestionDto);
    return;
  }

  @DeleteAuth('/:questionId', 'Delete Question')
  async deleteQuestion(@User() user, @Param('questionId') questionId: string) {
    await this.questionService.deleteQuestion(questionId);
    return;
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

  @ApiPagination('/:questionId/answer', 'Fetch Answers for single question')
  async fetchAnswersForSingleQuestions(
    @Param('questionId') questionId: string,
    @Pagination() paginationOption: PaginationOption,
    @User('id') userId,
  ) {
    return await this.answerService.findByQuestionId(
      questionId,
      paginationOption,
      userId,
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

  @PostAuth('/answer/:answerId/cancel-vote', 'Cancel answer vote')
  async cancelAnswerVote(
    @Param('answerId') answerId: string,
    @User('id') userId: string,
  ) {
    await this.answerService.cancelVote(answerId, userId);
  }
}
