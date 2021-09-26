import { Injectable } from '@nestjs/common';
import { User, UserDocument, UserRole } from './schemas/user.schema';
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
        ? this.getPreferredTagsScore(createUserDto.preferredTags, true)
        : [],
    });
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<boolean> {
    const user = await this.exists(id);
    user.set(updateUserDto);
    await user.save();
    if (updateUserDto.preferredTags) {
      await this.removeUserAddedPreferenceTags(id, updateUserDto.preferredTags);
      await this.updatePreferredTagsScore(
        id,
        updateUserDto.preferredTags,
        5,
        0,
        true,
      );
    }
    return true;
  }

  private async removeUserAddedPreferenceTags(
    id: string,
    newPreferredTags: string[],
  ) {
    await this.userModel.updateOne(
      { _id: id },
      {
        $pull: {
          preferredTagsScore: {
            addedByUser: true,
            tag: { $nin: newPreferredTags },
          },
        },
      },
    );
  }

  async updatePreferredTagsScore(
    id: string,
    preferredTags: string[],
    score = TagScoreOption.DEFAULT_PRIMARY_SCORE_INC,
    updateScore = TagScoreOption.DEFAULT_PRIMARY_SCORE_INC,
    addedByUser = false,
  ) {
    await this.exists(id);
    preferredTags.forEach(async (tag) => {
      const scoredBefore = await this.isScoredBefore(id, tag);

      if (scoredBefore) {
        await this.updateTagScore(id, tag, updateScore);
      } else {
        await this.addTagScore(id, tag, score, addedByUser);
      }
    });
  }

  private async addTagScore(
    id: string,
    tag: string,
    score: number,
    addedByUser = false,
  ) {
    await this.userModel.updateOne(
      { _id: id },
      {
        $push: {
          preferredTagsScore: {
            tag,
            score,
            addedByUser,
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
  private getPreferredTagsScore(
    preferredTags: string[],
    addedByUser = false,
    score = 5,
  ) {
    return preferredTags.map((tag) => ({
      tag,
      score,
      addedByUser,
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

  async count(role: UserRole) {
    return await this.userModel.countDocuments({ role });
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
