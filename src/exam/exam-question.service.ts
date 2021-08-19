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

@Injectable()
export class ExamQuestionService {
  constructor(
    @InjectModel(ExamQuestion.name)
    public examQuestionModel: Model<ExamQuestionDocument>,
    private examService: ExamService,
  ) {}

  async existsByQuestionAndExamId(addExamQuestionDto) {
    // check if exam with the given exam id exists
    await this.examService.exists(addExamQuestionDto.examId);

    // check if the question is unique for this exam
    const examQuestion = await this.examQuestionModel.findOne({
      examId: addExamQuestionDto.examId,
      question: addExamQuestionDto.question,
    });

    if (examQuestion) {
      throw new QuestionAlreadyAddedException();
    }
  }
  async addQuestionToExam(addExamQuestionDto: AddExamQuestionDto) {
    await this.checkForDuplicateAnswer(addExamQuestionDto);
    await this.checkForCorrectAnswer(addExamQuestionDto);
    await this.existsByQuestionAndExamId(addExamQuestionDto);

    return this.examQuestionModel.create(addExamQuestionDto);
  }

  async findByExamId(examId: string) {
    await this.examService.exists(examId);

    return this.examQuestionModel.find({ examId });
  }

  async exists(examQuestionId: string) {
    const examQuestion = await this.examQuestionModel.findById(examQuestionId);

    if (!examQuestion) {
      throw new ExamQuestionDoesNotExistException();
    }

    return examQuestion;
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
}
