import { BadRequestException } from '@nestjs/common';

export class AccountDoesNotExistException extends BadRequestException {
  constructor(message?: string) {
    message = message ? message : "Account doesn 't exist";
    super({
      message,
      exception: AccountDoesNotExistException.name,
    });
  }
}
