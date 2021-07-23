import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RaiseQuestionDto } from './dto/raise-question.dto';
import { QuestionDoesNotExistException } from './exceptions/question-doesnot-exist.exception';
import { Question, QuestionDocument } from './schema/question.schema';
import * as mongoose from 'mongoose';

@Injectable()
export class QuestionService {
  constructor(
    @InjectModel(Question.name) public questionModel: Model<QuestionDocument>,
  ) {}

  async raiseQuestion(raiseQuestionDto: RaiseQuestionDto) {
    return await this.questionModel.create(raiseQuestionDto);
  }

  async fetchAll() {
    return await this.questionModel.aggregate([
      {
        $project: {
          question: 1,
          askedBy: 1,
          tags: 1,
          createdAt: 1,
          upvotes: { $size: '$upvotes' },
          downvotes: { $size: '$downvotes' },
        },
      },
    ]);
  }

  async fetchOne(questionId: string) {
    return await this.questionModel.aggregate([
      { $match: { _id: mongoose.Types.ObjectId(questionId) } },
      {
        $project: {
          question: 1,
          askedBy: 1,
          tags: 1,
          createdAt: 1,
          upvotes: { $size: '$upvotes' },
          downvotes: { $size: '$downvotes' },
        },
      },
    ]);
  }

  async exists(id: string, throwException = true) {
    const question = await this.questionModel.findById(id);
    if (!question && throwException) {
      throw new QuestionDoesNotExistException();
    }
    return question;
  }

  async upvote(questionId: string, userId: string) {
    await this.exists(questionId);
    await this.questionModel.updateOne(
      { _id: questionId, upvotes: { $nin: [userId] } },
      { $pull: { downvotes: userId }, $push: { upvotes: userId } },
    );
  }

  async downvote(questionId: string, userId: string) {
    await this.exists(questionId);
    await this.questionModel.updateOne(
      { _id: questionId, downvotes: { $nin: [userId] } },
      { $pull: { upvotes: userId }, $push: { downvotes: userId } },
    );
  }

  async cancelVote(questionId: string, userId: string) {
    await this.exists(questionId);
    await this.questionModel.updateOne(
      { _id: questionId },
      { $pull: { upvotes: userId, downvotes: userId } },
    );
  }
}
