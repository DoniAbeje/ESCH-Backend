import { Exam, ExamDocument } from './schema/exam.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class ExamService {
  constructor(@InjectModel(Exam.name) public examModel: Model<ExamDocument>) {}
}
