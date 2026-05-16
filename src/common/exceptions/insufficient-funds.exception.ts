import { UnprocessableEntityException } from "@nestjs/common";

interface InsufficientFundsDetails {
  currentBalance: number;
  requestedAmount: number;
}

export class InsufficientFundsException extends UnprocessableEntityException {
  constructor({ currentBalance, requestedAmount }: InsufficientFundsDetails) {
    super({
      statusCode: 422,
      error: "INSUFFICIENT_FUNDS",
      message: `Insufficient funds: balance is ${currentBalance}, but ${requestedAmount} was requested.`,
    });
  }
}
