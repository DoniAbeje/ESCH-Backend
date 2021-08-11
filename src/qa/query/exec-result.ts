import { ExecResultCanNotBeNullException } from "./exec-result-can-not-be-null-exception";

export class ExecResult {
    private data = [];
    constructor(data: any[]) {
      if (data == null) {
        throw new ExecResultCanNotBeNullException(
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