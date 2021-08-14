import {
  ExamQuestion,
  ExamQuestionDocument,
} from './schema/exam-question.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AddExamQuestionDto } from './dto/add-exam-question.dto';
import { ExamService } from './exam.service';
import { DuplicateChoiceKeyFoundException } from './exceptions/duplicate-choice-key-found.exception';
import { DuplicateChoiceValueFoundException } from './exceptions/duplicate-choice-value-found.exception';
import { AnswerKeyNotPartOfChoiceException } from './exceptions/answer-key-not-part-of-choice.exception';
import { UpdateExamQuestionDto } from './dto/update-exam-question.dto';
import { ExamQuestionDoesNotExistException } from './exceptions/examQuestion-doesnot-exist.exception';

@Injectable()
export class ExamQuestionService {
  constructor(
    @InjectModel(ExamQuestion.name)
    public examQuestionModel: Model<ExamQuestionDocument>,
    private examService: ExamService,
  ) {}

  async addQuestionToExam(addExamQuestionDto: AddExamQuestionDto) {
    // check if keys and choices are unique
    const keySet = new Set(),
      choiceSet = new Set();
    let correctAnswerKeyFound = false;

    for (const choice of addExamQuestionDto.choice) {
      if (keySet.has(choice.key.toLocaleLowerCase())) {
        throw new DuplicateChoiceKeyFoundException();
      }
      if (choiceSet.has(choice.choice.toLocaleLowerCase())) {
        throw new DuplicateChoiceValueFoundException();
      }
      if (choice.key === addExamQuestionDto.correctAnswer) {
        correctAnswerKeyFound = true;
      }

      keySet.add(choice.key.toLocaleLowerCase());
      choiceSet.add(choice.choice.toLocaleLowerCase());
    }

    // check if the given correctAnswer value(key) is part of the choice
    if (!correctAnswerKeyFound) {
      throw new AnswerKeyNotPartOfChoiceException();
    }

    // check if the question is unique for this exam

    // check if exam with the given exam id exists
    await this.examService.exists(addExamQuestionDto.examId);

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

    await examQuestion.updateOne(updateExamQuestionDto);

    return examQuestion;
  }
}
