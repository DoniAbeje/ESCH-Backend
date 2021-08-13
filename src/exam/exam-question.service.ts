import {
  ExamQuestion,
  ExamQuestionDocument,
} from './schema/exam-question.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AddExamQuestionDto } from './dto/add-exam-question.dto';
import { ExamService } from './exam.service';

@Injectable()
export class ExamQuestionService {
  constructor(
    @InjectModel(ExamQuestion.name)
    public examQuestionModel: Model<ExamQuestionDocument>,
    private examService: ExamService,
  ) {}

  async addQuestionToExam(addExamQuestionDto: AddExamQuestionDto) {
    // check if keys and choices are unique
    // check if the given correctAnswer value(key) is part of the choice
    const keySet = new Set(),
      choiceSet = new Set();
    let correctAnswerKeyFound = false;

    for (const choice of addExamQuestionDto.choice) {
      if (keySet.has(choice.key.toLocaleLowerCase())) {
        throw new Error('Duplicate key found');
      }
      if (choiceSet.has(choice.choice.toLocaleLowerCase())) {
        throw new Error('Duplicate choice found');
      }
      if (choice.key === addExamQuestionDto.correctAnswer) {
        correctAnswerKeyFound = true;
      }

      keySet.add(choice.key.toLocaleLowerCase());
      choiceSet.add(choice.choice.toLocaleLowerCase());
    }

    if (!correctAnswerKeyFound) {
      throw new Error('Correct answer key is not part of the choice');
    }

    // check if the question is unique for this exam

    // check if exam with the given exam id exists
    await this.examService.exists(addExamQuestionDto.examId);

    return this.examQuestionModel.create(addExamQuestionDto);
  }
}
