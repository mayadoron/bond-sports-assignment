import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, TransactionType } from '@prisma/client';
import { TransactionsService } from './transactions.service';
import { PrismaService } from '../prisma/prisma.service';
import { AccountsService } from '../accounts/accounts.service';
import { AccountNotFoundException } from '../common/exceptions/account-not-found.exception';
import { AccountInactiveException } from '../common/exceptions/account-inactive.exception';
import { InsufficientFundsException } from '../common/exceptions/insufficient-funds.exception';
import { DailyLimitExceededException } from '../common/exceptions/daily-limit-exceeded.exception';

const ACCOUNT_ID = 'a3f1c2d4-5678-4e90-b123-456789abcdef';

const activeAccount = {
  accountId:            ACCOUNT_ID,
  balance:              1000,
  dailyWithdrawalLimit: 500,
  isActive:             true,
};

const inactiveAccount = { ...activeAccount, isActive: false };

const fakeDepositResult    = { accountId: ACCOUNT_ID, value: 200, type: TransactionType.DEPOSIT,    transactionDate: new Date() };
const fakeWithdrawalResult = { accountId: ACCOUNT_ID, value: 300, type: TransactionType.WITHDRAWAL, transactionDate: new Date() };

describe('TransactionsService', () => {
  let service: TransactionsService;

  let mockTx: {
    account:     { findUniqueOrThrow: jest.Mock; update: jest.Mock };
    transaction: { create: jest.Mock; aggregate: jest.Mock };
  };

  let prisma: {
    $transaction:  jest.Mock;
    transaction:   { findMany: jest.Mock };
  };

  let mockAccountsService: { findAccountById: jest.Mock };

  beforeEach(async () => {
    mockTx = {
      account: {
        findUniqueOrThrow: jest.fn(),
        update:            jest.fn(),
      },
      transaction: {
        create:    jest.fn(),
        aggregate: jest.fn(),
      },
    };

    prisma = {
      $transaction: jest.fn().mockImplementation((callback) => callback(mockTx)),
      transaction:  { findMany: jest.fn() },
    };

    mockAccountsService = { findAccountById: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: PrismaService,  useValue: prisma },
        { provide: AccountsService, useValue: mockAccountsService },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  describe('deposit', () => {

    it('increments the balance and returns a DEPOSIT transaction', async () => {
      mockAccountsService.findAccountById.mockResolvedValue(activeAccount);
      mockTx.account.findUniqueOrThrow.mockResolvedValue(activeAccount);
      mockTx.transaction.create.mockResolvedValue(fakeDepositResult);

      const result = await service.deposit(ACCOUNT_ID, { value: 200 });

      expect(mockTx.account.update).toHaveBeenCalledWith({
        where: { accountId: ACCOUNT_ID },
        data:  { balance: { increment: 200 } },
      });
      expect(result.type).toBe(TransactionType.DEPOSIT);
      expect(result.value).toBe(200);
    });

    it('throws AccountNotFoundException when the account does not exist', async () => {
      mockTx.account.findUniqueOrThrow.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError(
          'Record not found',
          { code: 'P2025', clientVersion: '5.22.0' },
        ),
      );

      await expect(service.deposit(ACCOUNT_ID, { value: 200 })).rejects.toThrow(
        AccountNotFoundException,
      );
    });

    it('throws AccountInactiveException when the account is blocked', async () => {
      mockAccountsService.findAccountById.mockResolvedValue(inactiveAccount);
      mockTx.account.findUniqueOrThrow.mockResolvedValue(inactiveAccount);

      await expect(service.deposit(ACCOUNT_ID, { value: 200 })).rejects.toThrow(
        AccountInactiveException,
      );
    });

  });

  describe('withdraw', () => {

    it('decrements the balance and returns a WITHDRAWAL transaction', async () => {
      mockAccountsService.findAccountById.mockResolvedValue(activeAccount);
      mockTx.account.findUniqueOrThrow.mockResolvedValue(activeAccount);
      mockTx.transaction.aggregate.mockResolvedValue({ _sum: { value: 0 } });
      mockTx.transaction.create.mockResolvedValue(fakeWithdrawalResult);

      const result = await service.withdraw(ACCOUNT_ID, { value: 300 });

      expect(mockTx.account.update).toHaveBeenCalledWith({
        where: { accountId: ACCOUNT_ID },
        data:  { balance: { decrement: 300 } },
      });
      expect(result.type).toBe(TransactionType.WITHDRAWAL);
      expect(result.value).toBe(300);
    });

    it('throws InsufficientFundsException when the balance is too low', async () => {
      const poorAccount = { ...activeAccount, balance: 50 };
      mockAccountsService.findAccountById.mockResolvedValue(poorAccount);
      mockTx.account.findUniqueOrThrow.mockResolvedValue(poorAccount);
      mockTx.transaction.aggregate.mockResolvedValue({ _sum: { value: 0 } });

      await expect(service.withdraw(ACCOUNT_ID, { value: 200 })).rejects.toThrow(
        InsufficientFundsException,
      );
    });

    it('throws DailyLimitExceededException when the daily limit would be exceeded', async () => {
      mockAccountsService.findAccountById.mockResolvedValue(activeAccount);
      mockTx.account.findUniqueOrThrow.mockResolvedValue(activeAccount);
      mockTx.transaction.aggregate.mockResolvedValue({ _sum: { value: 400 } });

      await expect(service.withdraw(ACCOUNT_ID, { value: 200 })).rejects.toThrow(
        DailyLimitExceededException,
      );
    });

  });

  describe('getStatement', () => {

    it('returns the list of transactions for the account', async () => {
      mockAccountsService.findAccountById.mockResolvedValue(activeAccount);
      prisma.transaction.findMany.mockResolvedValue([
        fakeDepositResult,
        fakeWithdrawalResult,
      ]);

      const result = await service.getStatement(ACCOUNT_ID, {});

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe(TransactionType.DEPOSIT);
      expect(result[1].type).toBe(TransactionType.WITHDRAWAL);
    });

    it('throws AccountNotFoundException when the account does not exist', async () => {
      mockAccountsService.findAccountById.mockRejectedValue(
        new AccountNotFoundException(ACCOUNT_ID),
      );

      await expect(service.getStatement(ACCOUNT_ID, {})).rejects.toThrow(
        AccountNotFoundException,
      );
    });

  });

});
