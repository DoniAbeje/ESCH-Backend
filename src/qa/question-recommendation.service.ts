import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { TfIdf } from 'natural';
import { PaginationOption } from '../common/pagination-option';
import * as Vector from 'vector-object';
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

  private async vectorizeQuestions(questionsCount: number) {
    const vectors = [];

    for (let index = 0; index < questionsCount; index++) {
      const vecObj = {};
      this.tfidf.listTerms(index).forEach(function (item) {
        vecObj[item.term] = item.tfidf;
      });
      const vec = new Vector(vecObj);
      vectors.push(vec);
    }

    return vectors;
  }

  async fetchSimilarQuestions(
    examId: string,
    count = PaginationOption.DEFAULT_LIMIT,
  ) {
    await this.questionService.exists(examId);

    const questions = await this.setup();
    const vectors = await this.vectorizeQuestions(questions.length);

    const examIndex = this.fromQuestionIdToIndex[examId];

    return this.recommend(
      vectors[examIndex],
      vectors,
      questions,
      count,
      examIndex,
    );
  }

  private recommend(
    vector,
    vectors,
    questions: QuestionDocument[],
    count: number,
    questionIndex = -1,
  ) {
    const itemScores = {};

    for (let i = 0; i < questions.length; i++) {
      if (questionIndex == i) continue;
      const score = vector.getCosineSimilarity(vectors[i]);
      itemScores[this.fromIndexToQuestionId[i]] = score;
    }

    const sortedItemScore = Object.entries<number>(itemScores)
      .sort(([, a], [, b]) => b - a)
      .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});

    const recommendation: QuestionDocument[] = [];

    let cnt = 0;
    for (const sortedId in sortedItemScore) {
      if (cnt == count) break;
      recommendation.push(questions[this.fromQuestionIdToIndex[sortedId]]);
      cnt++;
    }

    return recommendation;
  }
}
