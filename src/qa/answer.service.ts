import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AnswerQuestionDto } from './dto/answer-question.dto';
import { Answer, AnswerDocument } from './schema/answer.schema';
import { QuestionService } from './question.service';
import { PaginationOption } from '../common/pagination-option';
import { AnswerQueryBuilder } from './query/answer-query-builder';
import { VoteService } from '../common/services/vote.service';
import { AnswerDoesNotExistException } from './exceptions/answer-doesnot-exist.exception';

@Injectable()
export class AnswerService extends VoteService {
  constructor(
    @InjectModel(Answer.name) public answerModel: Model<AnswerDocument>,
    private questionService: QuestionService,
  ) {
    super(answerModel);
  }

  async findByQuestionId(
    questionId: string,
    paginationOption: PaginationOption = PaginationOption.DEFAULT,
    loggedInUserId = null,
  ) {
    await this.questionService.exists(questionId);
    return (
      await new AnswerQueryBuilder(this.answerModel)
        .paginate(paginationOption)
        .filterByQuestionIds([questionId])
        .populateAnsweredBy()
        .populateUserVoteFlag(loggedInUserId)
        .exec()
    ).all();
  }

  async answerQuestion(answerQuestionDto: AnswerQuestionDto) {
    await this.questionService.exists(answerQuestionDto.question);
    return await this.answerModel.create(answerQuestionDto);
  }

  async count() {
    return await this.answerModel.countDocuments();
  }

  async exists(id: string, throwException = true) {
    const answer = await this.answerModel.findById(id);
    if (!answer && throwException) {
      throw new AnswerDoesNotExistException();
    }
    return answer;
  }
}
