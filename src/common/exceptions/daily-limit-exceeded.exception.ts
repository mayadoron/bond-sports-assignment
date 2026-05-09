import { UnprocessableEntityException } from '@nestjs/common';

interface DailyLimitExceededDetails {
  dailyWithdrawalLimit: number;
  alreadyWithdrawnToday: number;
  requestedAmount: number;
}

export class DailyLimitExceededException extends UnprocessableEntityException {
  constructor({
    dailyWithdrawalLimit,
    alreadyWithdrawnToday,
    requestedAmount,
  }: DailyLimitExceededDetails) {
    const remainingAllowance = dailyWithdrawalLimit - alreadyWithdrawnToday;
    super({
      statusCode: 422,
      error: 'DAILY_LIMIT_EXCEEDED',
      message:
        `Daily withdrawal limit exceeded: limit is ${dailyWithdrawalLimit}, ` +
        `already withdrawn today: ${alreadyWithdrawnToday}, ` +
        `requested: ${requestedAmount}, ` +
        `remaining allowance: ${remainingAllowance}.`,
    });
  }
}
