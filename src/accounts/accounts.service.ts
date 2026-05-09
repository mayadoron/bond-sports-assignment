import { Injectable } from '@nestjs/common';
import { Account } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccountNotFoundException } from '../common/exceptions/account-not-found.exception';
import { CreateAccountDto } from './dto/create-account.dto';
import { AccountResponseDto } from './dto/account-response.dto';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async createAccount(dto: CreateAccountDto): Promise<AccountResponseDto> {
    const account = await this.prisma.account.create({
      data: {
        personId: dto.personId,
        balance: dto.initialBalance ?? 0,
        dailyWithdrawalLimit: dto.dailyWithdrawalLimit,
        accountType: dto.accountType,
      },
    });

    return this.toResponseDto(account);
  }

  async findAccountById(accountId: string): Promise<AccountResponseDto> {
    const account = await this.prisma.account.findUnique({
      where: { accountId },
    });

    if (!account) {
      throw new AccountNotFoundException(accountId);
    }

    return this.toResponseDto(account);
  }

  async blockAccount(accountId: string): Promise<AccountResponseDto> {
    await this.assertAccountExists(accountId);

    const account = await this.prisma.account.update({
      where: { accountId },
      data: { isActive: false },
    });

    return this.toResponseDto(account);
  }

  async unblockAccount(accountId: string): Promise<AccountResponseDto> {
    await this.assertAccountExists(accountId);

    const account = await this.prisma.account.update({
      where: { accountId },
      data: { isActive: true },
    });

    return this.toResponseDto(account);
  }

  private async assertAccountExists(accountId: string): Promise<void> {
    const exists = await this.prisma.account.findUnique({
      where: { accountId },
      select: { accountId: true },
    });

    if (!exists) {
      throw new AccountNotFoundException(accountId);
    }
  }

  private toResponseDto(account: Account): AccountResponseDto {
    return {
      accountId: account.accountId,
      personId: account.personId,
      balance: Number(account.balance),
      dailyWithdrawalLimit: Number(account.dailyWithdrawalLimit),
      isActive: account.isActive,
      accountType: account.accountType,
      createdAt: account.createdAt.toISOString(),
    };
  }
}
