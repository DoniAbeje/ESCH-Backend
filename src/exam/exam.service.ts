import { Exam, ExamDocument } from './schema/exam.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateExamDto } from './dto/create-exam.dto';
import { ExamDoesNotExistException } from './exceptions/exam-doesnot-exist.exception';

@Injectable()
export class ExamService {
  constructor(@InjectModel(Exam.name) public examModel: Model<ExamDocument>) {}

  async createExam(createExamDto: CreateExamDto) {
    return this.examModel.create(createExamDto);
  }

  async fetchAll() {
    return this.examModel.find({});
  }

  async fetchOne(examId: string) {
    return this.exists(examId);
  }

  async exists(examId: string) {
    const exam = await this.examModel.findById(examId);

    if (!exam) {
      throw new ExamDoesNotExistException();
    }

    return exam;
  }
}
