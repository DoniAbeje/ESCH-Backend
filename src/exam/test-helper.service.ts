import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model } from 'mongoose';
import * as faker from 'faker';
import { Exam, ExamDocument } from './schema/exam.schema';
import { ExamService } from './exam.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { toJSON } from '../utils/utils';
import { UserDocument } from '../user/schemas/user.schema';

@Injectable()
export class ExamTestHelperService {
  constructor(
    @InjectModel(Exam.name) private examModel: Model<ExamDocument>,
    private examService: ExamService,
  ) {}

  async clearExams() {
    return await this.examModel.deleteMany({});
  }

  generateCreateExamDto(override: Partial<CreateExamDto> = {}): CreateExamDto {
    const _default: CreateExamDto = {
      title: faker.lorem.sentence(),
      description: faker.lorem.sentence(),
      price: 0,
      tags: [faker.lorem.word()],
      preparedBy: '',
    };
    return { ..._default, ...override };
  }

  async createTestExam(
    override: Partial<CreateExamDto> = {},
  ): Promise<ExamDocument> {
    const createExamDto: CreateExamDto = this.generateCreateExamDto(override);
    return await this.examService.createExam(createExamDto);
  }

  async createTestExams(
    amount: number,
    createExamDto: Partial<CreateExamDto> = {},
  ): Promise<ExamDocument[]> {
    const exams = [];
    for (let index = 0; index < amount; index++) {
      exams.push(await this.createTestExam(createExamDto));
    }
    return exams;
  }

  getResponse(exam: ExamDocument | ExamDocument[], user: UserDocument) {
    if (Array.isArray(exam)) {
      return exam.map((e) => this.getSingleResponse(e, user));
    }
    return this.getSingleResponse(exam, user);
  }

  private getSingleResponse(
    examDocument: ExamDocument,
    userDocument: UserDocument,
  ) {
    const user: LeanDocument<UserDocument> = toJSON(userDocument);
    const preparedBy = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePicture: user.profilePicture,
    };
    return { ...toJSON(examDocument), preparedBy };
  }
}
