import { Exam, ExamDocument } from './schema/exam.schema';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateExamDto } from './dto/create-exam.dto';
import { ExamDoesNotExistException } from './exceptions/exam-doesnot-exist.exception';
import { UpdateExamDto } from './dto/update-exam.dto';
import { PaginationOption } from '../common/pagination-option';
import { ExamQueryBuilder } from './query/exam-query-builder';
import { ExamRecommendationService } from './exam-recommendation.service';
import { RateService } from '../common/services/rate.service';

@Injectable()
export class ExamService extends RateService {
  constructor(
    @InjectModel(Exam.name) public examModel: Model<ExamDocument>,
    @Inject(forwardRef(() => ExamRecommendationService))
    private examRecommendationService: ExamRecommendationService,
  ) {
    super(examModel);
  }

  async createExam(createExamDto: CreateExamDto) {
    const exam = await this.examModel.create(createExamDto);
    this.examRecommendationService.setup(true);
    return exam;
  }

  async updateExam(examId: string, updateExamDto: UpdateExamDto) {
    const exam = await this.exists(examId);
    return exam.update(updateExamDto);
  }

  async fetchAll(
    paginationOption: PaginationOption = PaginationOption.DEFAULT,
    tags: string[] = [],
    authors: string[] = [],
    loggedInUserId: string = null,
  ) {
    return (
      await new ExamQueryBuilder(this.examModel)
        .paginate(paginationOption)
        .filterByTags(tags)
        .filterByAuthors(authors)
        .populatePreparedBy()
        .populateUserRating(loggedInUserId)
        .exec()
    ).all();
  }

  async fetchOne(examId: string, loggedInUserId: string = null) {
    const result = await new ExamQueryBuilder(this.examModel)
      .filterByIds([examId])
      .populatePreparedBy()
      .populateUserRating(loggedInUserId)
      .exec();
    if (result.isEmpty()) {
      throw new ExamDoesNotExistException();
    }
    return result.first();
  }

  async delete(examId: string) {
    const exam = await this.exists(examId);
    return await exam.delete();
  }

  async search(paginationOption: PaginationOption, keywords: string) {
    return (
      await new ExamQueryBuilder(this.examModel)
        .search(keywords)
        .paginate(paginationOption)
        .populatePreparedBy()
        .exec()
    ).all();
  }

  async count() {
    return await this.examModel.countDocuments();
  }

  async findByAuthor(userId: string){
    return (
      await new ExamQueryBuilder(this.examModel)
        .filterByAuthors([userId])
        .populatePreparedBy()
        .populateUserRating(userId)
        .exec()
    ).all();
  }

  async exists(examId: string, throwException = true) {
    const exam = await this.examModel.findById(examId);

    if (!exam && throwException) {
      throw new ExamDoesNotExistException();
    }

    return exam;
  }
}
