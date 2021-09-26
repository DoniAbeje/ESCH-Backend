import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { TfIdf } from 'natural';
import { ExamService } from './exam.service';
import { ExamDocument } from './schema/exam.schema';
import * as Vector from 'vector-object';
import { PaginationOption } from '../common/pagination-option';
import { UserService } from '../user/user.service';
import { TagScoreOption } from '../common/tag-score-option';

@Injectable()
export class ExamRecommendationService {
  private fromExamIdToIndex = {};
  private fromIndexToExamId = {};
  private tfidf: TfIdf;
  private needsSetup = true;

  constructor(
    @Inject(forwardRef(() => ExamService))
    private examService: ExamService,
    private userService: UserService,
  ) {
    this.tfidf = new TfIdf();
  }

  async setup(newExamAdded = false) {
    const exams: ExamDocument[] = await this.examService.fetchAll(null);

    if (newExamAdded || this.needsSetup) {
      this.fromExamIdToIndex = {};
      this.fromIndexToExamId = {};
      this.tfidf = new TfIdf();

      exams.forEach((exam, index) => {
        this.tfidf.addDocument(this.constructExamDocument(exam));
        this.fromExamIdToIndex[exam._id] = index;
        this.fromIndexToExamId[index] = exam._id;
      });
      this.needsSetup = false;
    }

    return exams;
  }

  private constructExamDocument(exam: ExamDocument, useDescription = true) {
    let examDoc = exam.title;
    if (useDescription) examDoc += ` ${exam.description}`;
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

  async fetchSimilarExams(
    examId: string,
    paginationOption: PaginationOption = PaginationOption.DEFAULT,
  ) {
    await this.examService.exists(examId);

    const exams = await this.setup();
    const vectors = await this.vectorizeExams(exams.length);

    const examIndex = this.fromExamIdToIndex[examId];

    return this.recommend(
      vectors[examIndex],
      vectors,
      exams,
      paginationOption,
      examIndex,
    );
  }

  async fetchExams(
    userId: string,
    paginationOption: PaginationOption = PaginationOption.DEFAULT,
  ) {
    const user = await this.userService.exists(userId);
    const exams = await this.setup();
    const vectors = await this.vectorizeExams(exams.length);
    const userVector = new Vector(
      user.preferredTagsScore.reduce(
        (a, c) => ({ ...a, [c.tag]: c.score }),
        {},
      ),
    );

    return this.recommend(userVector, vectors, exams, paginationOption);
  }

  private recommend(
    vector,
    vectors,
    exams: ExamDocument[],
    paginationOption: PaginationOption,
    examIndex = -1,
  ) {
    const itemScores = {};

    for (let i = 0; i < exams.length; i++) {
      if (examIndex == i) continue;
      const score = vector.getCosineSimilarity(vectors[i]);
      itemScores[this.fromIndexToExamId[i]] = score;
    }

    const sortedItemScore = Object.entries<number>(itemScores)
      .sort(([, a], [, b]) => b - a)
      .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});

    const sortedItems = Object.keys(sortedItemScore);

    const startingIndex = paginationOption.offset * paginationOption.limit;
    const selectedItems = sortedItems.slice(
      startingIndex,
      startingIndex + paginationOption.limit,
    );

    const recommendation: ExamDocument[] = selectedItems.map(
      (sortedId) => exams[this.fromExamIdToIndex[sortedId]],
    );

    return recommendation;
  }

  async updateUserPreference(
    userId: string,
    examId: string,
    score = TagScoreOption.DEFAULT_PRIMARY_SCORE_INC,
  ) {
    const exam = await this.examService.exists(examId);

    const tfidf = new TfIdf();

    tfidf.addDocument(this.constructExamDocument(exam, false));

    const terms: string[] = [];

    tfidf.listTerms(0).forEach((tfidfTerm) => {
      terms.push(tfidfTerm.term);
    });

    this.userService.updatePreferredTagsScore(userId, terms, score, score);
  }
}
