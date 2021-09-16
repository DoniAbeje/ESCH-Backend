import { Injectable } from '@nestjs/common';
import { TfIdf } from 'natural';
import { ExamService } from './exam.service';
import { ExamDocument } from './schema/exam.schema';

@Injectable()
export class ExamRecommendationService {
  private fromExamIdToIndex = {};
  private fromIndexToExamId = {};
  private tfidf: TfIdf;

  constructor(private examService: ExamService) {
    this.tfidf = new TfIdf();
  }

  async setup() {
    this.fromExamIdToIndex = {};
    this.fromIndexToExamId = {};
    this.tfidf = new TfIdf();

    const exams: ExamDocument[] = await this.examService.fetchAll(null);

    exams.forEach((exam, index) => {
      this.tfidf.addDocument(this.constructExamDocument(exam));
      this.fromExamIdToIndex[exam._id] = index;
      this.fromIndexToExamId[index] = exam._id;
    });

    return exams;
  }

  private constructExamDocument(exam: ExamDocument) {
    let examDoc = `${exam.title} ${exam.description}`;
    exam.tags.forEach((tag) => {
      examDoc += ` ${tag}`;
    });

    return examDoc;
  }
}
