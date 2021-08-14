import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Answer, AnswerDocument } from "./schema/answer.schema";
import { Question, QuestionDocument } from "./schema/question.schema";

@Injectable()
export class QaTestHelperService {
    constructor( @InjectModel(Question.name) private questionModel: Model<QuestionDocument>, 
    @InjectModel(Answer.name) private answerModel: Model<AnswerDocument>){}

    async clearQuestions(){
        return await this.questionModel.deleteMany({});
    }

    async clearAnswers(){
        return await this.answerModel.deleteMany({});
    }
}