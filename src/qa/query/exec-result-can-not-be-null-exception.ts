export class ExecResultCanNotBeNullException extends Error {
  constructor(message) {
    super(message);
    this.name = ExecResultCanNotBeNullException.name;
  }
}
