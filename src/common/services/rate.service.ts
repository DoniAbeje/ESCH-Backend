import { Model } from 'mongoose';
import { CancelRateDto } from '../dto/cancel-rate.dto';
import { RateDto } from '../dto/rate.dto';

export abstract class RateService {
  constructor(public model: Model<any>) {}

  abstract exists(questionId);

  async rate({ userId, rateableResourceId, rating }: RateDto) {
    await this.cancelRate({ userId, rateableResourceId });

    await this.model.updateOne(
      { _id: rateableResourceId },
      {
        $push: { ratings: { userId, rating } },
      },
    );
  }

  async cancelRate({ userId, rateableResourceId }: CancelRateDto) {
    await this.exists(rateableResourceId);
    await this.model.updateOne(
      { _id: rateableResourceId },
      {
        $pull: { ratings: { userId } },
      },
    );
  }
}
