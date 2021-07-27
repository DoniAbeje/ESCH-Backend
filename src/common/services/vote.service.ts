import { Model } from 'mongoose';

export abstract class VoteService {
  constructor(public model: Model<any>) {}

  abstract exists(questionId);

  async upvote(questionId: string, userId: string) {
    await this.exists(questionId);
    return this.model.updateOne(
      { _id: questionId, upvotes: { $nin: [userId] } },
      { $pull: { downvotes: userId }, $push: { upvotes: userId } },
    );
  }

  async downvote(questionId: string, userId: string) {
    await this.exists(questionId);
    return this.model.updateOne(
      { _id: questionId, downvotes: { $nin: [userId] } },
      { $pull: { upvotes: userId }, $push: { downvotes: userId } },
    );
  }

  async cancelVote(questionId: string, userId: string) {
    await this.exists(questionId);
    return this.model.updateOne(
      { _id: questionId },
      { $pull: { upvotes: userId, downvotes: userId } },
    );
  }
}
