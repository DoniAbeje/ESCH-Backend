import { QuestionExecResultCanNotBeNullException } from "./question-exec-result-can-not-be-null-exception";

export class QuestionExecResult {
    private data = [];
    constructor(data: any[]) {
      if (data == null) {
        throw new QuestionExecResultCanNotBeNullException(
          'You can not pass null as result',
        );
      }
      this.data = data;
    }
  
    all() {
      return this.data;
    }
  
    first() {
      return this.data[0];
    }
  }