import { Injectable } from '@nestjs/common';
import { TfIdf } from 'natural';
import { ExamService } from './exam.service';
import { ExamDocument } from './schema/exam.schema';
import * as Vector from 'vector-object';

@Injectable()
export class ExamRecommendationService {
  private fromExamIdToIndex = {};
  private fromIndexToExamId = {};
  private tfidf: TfIdf;
  private exams: ExamDocument[];
  private needsSetup = true;

  constructor(private examService: ExamService) {
    this.tfidf = new TfIdf();
  }

  async setup(newExamAdded = false) {
    if (newExamAdded || this.needsSetup) {
      this.fromExamIdToIndex = {};
      this.fromIndexToExamId = {};
      this.tfidf = new TfIdf();

      this.exams = await this.examService.fetchAll(null);

      this.exams.forEach((exam, index) => {
        this.tfidf.addDocument(this.constructExamDocument(exam));
        this.fromExamIdToIndex[exam._id] = index;
        this.fromIndexToExamId[index] = exam._id;
      });
      this.needsSetup = false;
    }
  }

  private constructExamDocument(exam: ExamDocument) {
    let examDoc = `${exam.title} ${exam.description}`;
    exam.tags.forEach((tag) => {
      examDoc += ` ${tag}`;
    });

    return examDoc;
  }

  private async vectorizeExams(examsCount: number) {
    const vectors = [];

    for (let index = 0; index < examsCount; index++) {
      const vecObj = {};
      this.tfidf.listTerms(index).forEach(function (item) {
        vecObj[item.term] = item.tfidf;
      });
      const vec = new Vector(vecObj);
      vectors.push(vec);
    }

    return vectors;
  }
}
