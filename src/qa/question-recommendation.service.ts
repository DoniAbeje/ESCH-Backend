import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { TfIdf } from 'natural';
import { QuestionService } from './question.service';
import { QuestionDocument } from './schema/question.schema';

@Injectable()
export class QuestionRecommendationService {
  private fromQuestionIdToIndex = {};
  private fromIndexToQuestionId = {};
  private tfidf: TfIdf;
  private needsSetup = true;

  constructor(
    @Inject(forwardRef(() => QuestionService))
    private questionService: QuestionService,
  ) {
    this.tfidf = new TfIdf();
  }

  async setup(newQuestionAdded = false) {
    const questions: QuestionDocument[] = await this.questionService.fetchAll(
      null,
    );

    if (newQuestionAdded || this.needsSetup) {
      this.fromQuestionIdToIndex = {};
      this.fromIndexToQuestionId = {};
      this.tfidf = new TfIdf();

      questions.forEach((question, index) => {
        this.tfidf.addDocument(this.constructQuestionDocument(question));
        this.fromQuestionIdToIndex[question._id] = index;
        this.fromIndexToQuestionId[index] = question._id;
      });
      this.needsSetup = false;
    }

    return questions;
  }

  private constructQuestionDocument(question: QuestionDocument) {
    let questionDoc = question.question;
    question.tags.forEach((tag) => {
      questionDoc += ` ${tag}`;
    });

    return questionDoc;
  }
}
