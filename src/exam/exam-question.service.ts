import {
  ExamQuestion,
  ExamQuestionDocument,
} from './schema/exam-question.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AddExamQuestionDto, Choice } from './dto/add-exam-question.dto';
import { ExamService } from './exam.service';
import { DuplicateChoiceKeyFoundException } from './exceptions/duplicate-choice-key-found.exception';
import { DuplicateChoiceValueFoundException } from './exceptions/duplicate-choice-value-found.exception';
import { AnswerKeyNotPartOfChoiceException } from './exceptions/answer-key-not-part-of-choice.exception';
import { UpdateExamQuestionDto } from './dto/update-exam-question.dto';
import { ExamQuestionDoesNotExistException } from './exceptions/examQuestion-doesnot-exist.exception';
import { QuestionAlreadyAddedException } from './exceptions/question-already-added.exception';
import { PaginationOption } from '../common/pagination-option';
import { ExamQuestionQueryBuilder } from './query/exam-question-query-builder';

@Injectable()
export class ExamQuestionService {
  constructor(
    @InjectModel(ExamQuestion.name)
    public examQuestionModel: Model<ExamQuestionDocument>,
    private examService: ExamService,
  ) {}

  async addQuestionToExam(addExamQuestionDto: AddExamQuestionDto) {
    await this.examService.exists(addExamQuestionDto.examId);
    this.checkForDuplicateAnswer(addExamQuestionDto);
    this.checkForCorrectAnswer(addExamQuestionDto);
    await this.checkForDuplicateQuestion(
      addExamQuestionDto.examId,
      addExamQuestionDto.question,
    );

    return this.examQuestionModel.create(addExamQuestionDto);
  }

  async fetchAll(
    paginationOption: PaginationOption = PaginationOption.getDefault(),
    examId: string,
  ) {
    await this.examService.exists(examId);
    return (
      await new ExamQuestionQueryBuilder(this.examQuestionModel)
        .paginate(paginationOption)
        .filterByExam([examId])
        .exec()
    ).all();
  }

  async fetchSamples(
    paginationOption: PaginationOption = PaginationOption.getDefault(),
    examId: string,
  ) {
    const exam = await this.examService.exists(examId);
    return (
      await new ExamQuestionQueryBuilder(this.examQuestionModel)
        .paginate(paginationOption)
        .filterByExam([examId])
        .filterByIds(exam.samples)
        .exec()
    ).all();
  }

  async updateExamQuestion(
    examQuestionId: string,
    updateExamQuestionDto: UpdateExamQuestionDto,
  ) {
    const examQuestion = await this.exists(examQuestionId);

    if (updateExamQuestionDto.choices) {
      this.checkForDuplicateAnswer(updateExamQuestionDto);
      this.checkForCorrectAnswer(
        updateExamQuestionDto,
        updateExamQuestionDto.correctAnswer || examQuestion.correctAnswer,
      );
    } else if (updateExamQuestionDto.correctAnswer) {
      this.checkForCorrectAnswer(
        examQuestion,
        updateExamQuestionDto.correctAnswer,
      );
    }

    if (updateExamQuestionDto.question) {
      await this.checkForDuplicateQuestion(
        examQuestion.examId,
        updateExamQuestionDto.question,
      );
    }

    await examQuestion.updateOne(updateExamQuestionDto);

    return examQuestion;
  }

  checkForCorrectAnswer(
    {
      choices,
      correctAnswer,
    }: AddExamQuestionDto | UpdateExamQuestionDto | ExamQuestionDocument,
    _correctAnswer: string = null,
  ) {
    correctAnswer = _correctAnswer || correctAnswer;
    const hasCorrectAnswerKey = choices.some((c) => c.key == correctAnswer);
    if (!hasCorrectAnswerKey) {
      throw new AnswerKeyNotPartOfChoiceException();
    }
  }

  checkForDuplicateAnswer({
    choices,
  }: AddExamQuestionDto | UpdateExamQuestionDto | ExamQuestionDocument) {
    const keySet = new Set();
    const choiceSet = new Set();

    for (const { key, choice } of choices) {
      if (keySet.has(key)) {
        throw new DuplicateChoiceKeyFoundException();
      }
      if (choiceSet.has(choice)) {
        throw new DuplicateChoiceValueFoundException();
      }

      keySet.add(key);
      choiceSet.add(choice);
    }
  }

  async checkForDuplicateQuestion(examId: string, question: string) {
    const examQuestion = await this.examQuestionModel.findOne({
      examId,
      question,
    });

    if (examQuestion) {
      throw new QuestionAlreadyAddedException();
    }
  }

  async exists(examQuestionId: string) {
    const examQuestion = await this.examQuestionModel.findById(examQuestionId);

    if (!examQuestion) {
      throw new ExamQuestionDoesNotExistException();
    }

    return examQuestion;
  }

  async deleteByExamId(examId: string) {
    return await this.examQuestionModel.deleteMany({ examId });
  }

  async delete(examQuestionId: string) {
    const question = await this.exists(examQuestionId);
    return await question.delete();
  }
}
