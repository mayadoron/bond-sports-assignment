import { ConflictException } from '@nestjs/common';

export class AccountInactiveException extends ConflictException {
  constructor(accountId: string) {
    super({
      statusCode: 409,
      error: 'ACCOUNT_INACTIVE',
      message: `Account "${accountId}" is inactive and cannot perform transactions.`,
    });
  }
}
