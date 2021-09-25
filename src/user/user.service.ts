import { Injectable } from '@nestjs/common';
import { User, UserDocument } from './schemas/user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { PhoneTakenException } from './exceptions/phone-taken.exception';
import * as bcrypt from 'bcrypt';
import { UserDoesNotExistException } from './exceptions/user-doesnot-exist.exception';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationOption } from '../common/pagination-option';
import { UserQuestionQueryBuilder } from './query/user-query-builder';
import { RateService } from '../common/services/rate.service';
import { TagScoreOption } from '../common/tag-score-option';

@Injectable()
export class UserService extends RateService {
  constructor(@InjectModel(User.name) public userModel: Model<UserDocument>) {
    super(userModel);
  }

  async createUser(createUserDto: CreateUserDto) {
    const phoneTaken = await this.existsByPhone(createUserDto.phone, false);
    if (phoneTaken) {
      throw new PhoneTakenException();
    }
    const passwordHash = await this.hashPassword(createUserDto.password);
    createUserDto = { ...createUserDto, password: passwordHash };

    return await this.userModel.create({
      ...createUserDto,
      preferredTagsScore: createUserDto.preferredTags
        ? this.getPreferredTagsScore(createUserDto.preferredTags)
        : [],
    });
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<boolean> {
    const user = await this.exists(id);
    user.set(updateUserDto);
    await user.save();
    return true;
  }

  async updatePreferredTagsScore(
    id: string,
    preferredTags: string[],
    score = TagScoreOption.DEFAULT_PRIMARY_SCORE_INC,
  ) {
    await this.exists(id);
    preferredTags.forEach(async (tag) => {
      const scoredBefore = await this.isScoredBefore(id, tag);

      if (scoredBefore) {
        await this.updateTagScore(id, tag, score);
      } else {
        await this.addTagScore(id, tag, score);
      }
    });
  }

  private async addTagScore(id: string, tag: string, score: number) {
    await this.userModel.updateOne(
      { _id: id },
      {
        $push: {
          preferredTagsScore: {
            tag,
            score,
          },
        },
      },
    );
  }

  private async updateTagScore(id: string, tag: string, score: number) {
    await this.userModel.updateOne(
      { _id: id, 'preferredTagsScore.tag': tag },
      {
        $inc: {
          'preferredTagsScore.$.score': score,
        },
      },
    );
  }

  async isScoredBefore(_id: string, tag: string): Promise<boolean> {
    return await this.userModel.exists({
      _id,
      'preferredTagsScore.tag': tag,
    });
  }
  // update score value
  private getPreferredTagsScore(preferredTags: string[], score = 5) {
    return preferredTags.map((tag) => ({
      tag,
      score,
    }));
  }

  async fetchAll(
    paginationOption: PaginationOption = PaginationOption.DEFAULT,
    loggedInUserId: string = null,
  ) {
    return (
      await new UserQuestionQueryBuilder(this.userModel)
        .paginate(paginationOption)
        .populateUserRating(loggedInUserId)
        .exec()
    ).all();
  }

  async fetchOne(userId: string, loggedInUserId: string = null) {
    const result = await new UserQuestionQueryBuilder(this.userModel)
      .filterByIds([userId])
      .populateUserRating(loggedInUserId)
      .exec();

    if (result.isEmpty()) {
      throw new UserDoesNotExistException();
    }
    return result.first();
  }

  async exists(id: string, throwException = true) {
    const user = await this.userModel.findById(id);
    if (!user && throwException) {
      throw new UserDoesNotExistException(`no user with id '${id}' exists`);
    }
    return user;
  }

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  async existsByPhone(phone: string, throwException = true) {
    const user = await this.userModel.findOne({ phone });
    if (!user && throwException) {
      throw new UserDoesNotExistException(
        `no user with phone '${phone}' exists`,
      );
    }
    return user;
  }
}
