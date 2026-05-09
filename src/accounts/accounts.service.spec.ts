import { Test, TestingModule } from '@nestjs/testing';
import { AccountType } from '@prisma/client';
import { AccountsService } from './accounts.service';
import { PrismaService } from '../prisma/prisma.service';
import { AccountNotFoundException } from '../common/exceptions/account-not-found.exception';

const ACCOUNT_ID = 'a3f1c2d4-5678-4e90-b123-456789abcdef';
const PERSON_ID  = 'b4e2d3f5-6789-4f01-c234-567890bcdef0';

const mockAccount = {
  accountId:            ACCOUNT_ID,
  personId:             PERSON_ID,
  balance:              1000,
  dailyWithdrawalLimit: 500,
  isActive:             true,
  accountType:          AccountType.CHECKING,
  createdAt:            new Date('2026-01-01'),
};

describe('AccountsService', () => {
  let service: AccountsService;

  let prisma: {
    account: {
      create:     jest.Mock;
      findUnique: jest.Mock;
      update:     jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      account: {
        create:     jest.fn(),
        findUnique: jest.fn(),
        update:     jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
  });

  describe('findAccountById', () => {

    it('returns the account when it exists in the database', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccount);

      const result = await service.findAccountById(ACCOUNT_ID);

      expect(result.accountId).toBe(ACCOUNT_ID);
      expect(result.isActive).toBe(true);
      expect(result.balance).toBe(1000);
    });

    it('throws AccountNotFoundException when the account does not exist', async () => {
      prisma.account.findUnique.mockResolvedValue(null);

      await expect(service.findAccountById(ACCOUNT_ID)).rejects.toThrow(
        AccountNotFoundException,
      );
    });

  });

  describe('createAccount', () => {

    it('calls the database with the correct data and returns the new account', async () => {
      prisma.account.create.mockResolvedValue(mockAccount);

      const result = await service.createAccount({
        personId:             PERSON_ID,
        dailyWithdrawalLimit: 500,
        accountType:          AccountType.CHECKING,
      });

      expect(prisma.account.create).toHaveBeenCalledWith({
        data: {
          personId:             PERSON_ID,
          balance:              0,
          dailyWithdrawalLimit: 500,
          accountType:          AccountType.CHECKING,
        },
      });

      expect(result.accountId).toBe(ACCOUNT_ID);
      expect(result.personId).toBe(PERSON_ID);
    });

  });

  describe('blockAccount', () => {

    it('sets isActive to false and returns the updated account', async () => {
      prisma.account.findUnique.mockResolvedValue({ accountId: ACCOUNT_ID });
      prisma.account.update.mockResolvedValue({ ...mockAccount, isActive: false });

      const result = await service.blockAccount(ACCOUNT_ID);

      expect(prisma.account.update).toHaveBeenCalledWith({
        where: { accountId: ACCOUNT_ID },
        data:  { isActive: false },
      });

      expect(result.isActive).toBe(false);
    });

    it('throws AccountNotFoundException when trying to block a non-existent account', async () => {
      prisma.account.findUnique.mockResolvedValue(null);

      await expect(service.blockAccount(ACCOUNT_ID)).rejects.toThrow(
        AccountNotFoundException,
      );
    });

  });

});
