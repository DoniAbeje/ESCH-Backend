import { NotFoundException } from '@nestjs/common';

export class UserDoesNotExistException extends NotFoundException {
  constructor(message?: string) {
    message = message ? message : "User doesn't exist";
    super({
      message,
      exception: UserDoesNotExistException.name,
    });
  }
}
