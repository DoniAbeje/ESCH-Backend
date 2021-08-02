import { Exam, ExamDocument } from './schema/exam.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateExamDto } from './dto/create-exam.dto';

@Injectable()
export class ExamService {
  constructor(@InjectModel(Exam.name) public examModel: Model<ExamDocument>) {}

  async createExam(createExamDto: CreateExamDto) {
    return await this.examModel.create(createExamDto);
  }
}
