export class QuestionExecResultCanNotBeNullException extends Error {
    constructor(message) {
      super(message);
      this.name = QuestionExecResultCanNotBeNullException.name;
    }
  }