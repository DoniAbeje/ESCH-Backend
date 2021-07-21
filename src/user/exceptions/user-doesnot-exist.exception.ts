import { BadRequestException } from '@nestjs/common';

export class UserDoesNotExistException extends BadRequestException {
  constructor(message?: string) {
    message = message ? message : "User doesn't exist";
    super({
      message,
      exception: UserDoesNotExistException.name,
    });
  }
}
