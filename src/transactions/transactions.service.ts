import { Injectable } from "@nestjs/common";
import { Prisma, Transaction, TransactionType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AccountsService } from "../accounts/accounts.service";
import { AccountNotFoundException } from "../common/exceptions/account-not-found.exception";
import { AccountInactiveException } from "../common/exceptions/account-inactive.exception";
import { InsufficientFundsException } from "../common/exceptions/insufficient-funds.exception";
import { DailyLimitExceededException } from "../common/exceptions/daily-limit-exceeded.exception";
import { TransactionAmountDto } from "./dto/transaction-amount.dto";
import { StatementFilterDto } from "./dto/statement-filter.dto";
import { TransactionResponseDto } from "./dto/transaction-response.dto";

const MAX_RETRIES = 3;
const TRANSACTION_FAILURE_CODE = "P2034";

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountsService: AccountsService,
  ) {}

  async deposit(
    accountId: string,
    dto: TransactionAmountDto,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.retry(() =>
      this.prisma.$transaction(
        async (tx) => {
          const account = await tx.account.findUniqueOrThrow({
            where: { accountId },
          });

          if (!account.isActive) {
            throw new AccountInactiveException(accountId);
          }

          await tx.account.update({
            where: { accountId },
            data: { balance: { increment: dto.value } },
          });

          return tx.transaction.create({
            data: {
              accountId,
              value: dto.value,
              type: TransactionType.DEPOSIT,
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      ),
    ).catch((err) => {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        throw new AccountNotFoundException(accountId);
      }
      throw err;
    });

    return this.toResponseDto(transaction);
  }

  async withdraw(
    accountId: string,
    dto: TransactionAmountDto,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.retry(() =>
      this.prisma.$transaction(
        async (tx) => {
          const account = await tx.account.findUniqueOrThrow({
            where: { accountId },
          });

          if (!account.isActive) {
            throw new AccountInactiveException(accountId);
          }

          const alreadyWithdrawnToday =
            await this.calculateWithdrawnTodayAmount(tx, accountId);

          const dailyWithdrawalLimit = Number(account.dailyWithdrawalLimit);
          const wouldExceedDailyLimit =
            alreadyWithdrawnToday + dto.value > dailyWithdrawalLimit;

          if (wouldExceedDailyLimit) {
            throw new DailyLimitExceededException({
              dailyWithdrawalLimit,
              alreadyWithdrawnToday,
              requestedAmount: dto.value,
            });
          }

          const currentBalance = Number(account.balance);
          if (currentBalance < dto.value) {
            throw new InsufficientFundsException({
              currentBalance,
              requestedAmount: dto.value,
            });
          }

          await tx.account.update({
            where: { accountId },
            data: { balance: { decrement: dto.value } },
          });

          return tx.transaction.create({
            data: {
              accountId,
              value: dto.value,
              type: TransactionType.WITHDRAWAL,
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      ),
    ).catch((err) => {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        throw new AccountNotFoundException(accountId);
      }
      throw err;
    });

    return this.toResponseDto(transaction);
  }

  async getStatement(
    accountId: string,
    filter: StatementFilterDto,
  ): Promise<TransactionResponseDto[]> {
    await this.accountsService.findAccountById(accountId);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        accountId,
        ...this.buildDateRangeFilter(filter),
      },
      orderBy: { transactionDate: "desc" },
    });

    return transactions.map((t) => this.toResponseDto(t));
  }

  private async retry<T>(
    operation: () => Promise<T>,
  ): Promise<T> {
    let lastError;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === TRANSACTION_FAILURE_CODE
        ) {
          lastError = error;
          continue;
        }
        throw error;
      }
    }
    throw lastError;
  }

  private async calculateWithdrawnTodayAmount(
    tx: Prisma.TransactionClient,
    accountId: string,
  ): Promise<number> {
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setUTCHours(23, 59, 59, 999);

    const result = await tx.transaction.aggregate({
      _sum: { value: true },
      where: {
        accountId,
        type: TransactionType.WITHDRAWAL,
        transactionDate: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    return Number(result._sum.value ?? 0);
  }

  private buildDateRangeFilter(
    filter: StatementFilterDto,
  ): Prisma.TransactionWhereInput {
    if (!filter.from && !filter.to) {
      return {};
    }

    return {
      transactionDate: {
        ...(filter.from && { gte: new Date(filter.from) }),
        ...(filter.to && { lte: new Date(filter.to) }),
      },
    };
  }

  private toResponseDto(transaction: Transaction): TransactionResponseDto {
    return {
      transactionId: transaction.transactionId,
      accountId: transaction.accountId,
      value: Number(transaction.value),
      type: transaction.type,
      transactionDate: transaction.transactionDate.toISOString(),
    };
  }
}
