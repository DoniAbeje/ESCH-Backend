import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AnswerQuestionDto } from './dto/answer-question.dto';
import { Answer, AnswerDocument } from './schema/answer.schema';
import * as mongoose from 'mongoose';
import { QuestionService } from './question.service';

@Injectable()
export class AnswerService {
  constructor(
    @InjectModel(Answer.name) public answerModel: Model<AnswerDocument>,
    private questionService: QuestionService,
  ) {}

  async findByQuestionId(questionId: string) {
    await this.questionService.exists(questionId);
    return await this.answerModel.aggregate([
      {
        $match: { question: mongoose.Types.ObjectId(questionId) },
      },
      {
        $project: {
          answer: 1,
          question: 1,
          answeredBy: 1,
          createdAt: 1,
          upvotes: { $size: '$upvotes' },
          downvotes: { $size: '$downvotes' },
        },
      },
    ]);
  }

  async answerQuestion(answerQuestionDto: AnswerQuestionDto) {
    await this.questionService.exists(answerQuestionDto.question);
    return this.answerModel.create(answerQuestionDto);
  }
}
