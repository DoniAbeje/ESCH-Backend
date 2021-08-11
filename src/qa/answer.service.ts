import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AnswerQuestionDto } from './dto/answer-question.dto';
import { Answer, AnswerDocument } from './schema/answer.schema';
import { QuestionService } from './question.service';
import { PaginationOption } from '../common/pagination-option';
import { AnswerQueryBuilder } from './query/answer-query-builder';

@Injectable()
export class AnswerService {
  constructor(
    @InjectModel(Answer.name) public answerModel: Model<AnswerDocument>,
    private questionService: QuestionService,
  ) {}

  async findByQuestionId(
    questionId: string,
    paginationOption: PaginationOption = PaginationOption.getDefault(),
  ) {
    await this.questionService.exists(questionId);
    return (
      await new AnswerQueryBuilder(this.answerModel)
        .paginate(paginationOption)
        .filterByQuestionIds([questionId])
        .populateAnsweredBy()
        .exec()
    ).all();
  }

  async answerQuestion(answerQuestionDto: AnswerQuestionDto) {
    await this.questionService.exists(answerQuestionDto.question);
    return this.answerModel.create(answerQuestionDto);
  }
}
