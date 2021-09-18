import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { TfIdf } from 'natural';
import { QuestionService } from './question.service';

@Injectable()
export class QuestionRecommendationService {
  private fromExamIdToIndex = {};
  private fromIndexToExamId = {};
  private tfidf: TfIdf;
  private needsSetup = true;

  constructor(
    @Inject(forwardRef(() => QuestionService))
    private questionService: QuestionService,
  ) {
    this.tfidf = new TfIdf();
  }
}
