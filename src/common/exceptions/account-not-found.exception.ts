import { NotFoundException } from "@nestjs/common";

export class AccountNotFoundException extends NotFoundException {
  constructor(accountId: string) {
    super({
      statusCode: 404,
      error: "ACCOUNT_NOT_FOUND",
      message: `Account with ID "${accountId}" was not found.`,
    });
  }
}
