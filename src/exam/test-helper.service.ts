import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as faker from 'faker';
import { Exam, ExamDocument } from './schema/exam.schema';
import { ExamService } from './exam.service';
import { CreateExamDto } from './dto/create-exam.dto';

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
}
