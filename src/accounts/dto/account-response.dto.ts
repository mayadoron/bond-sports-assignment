import { AccountType } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AccountResponseSchema = z.object({
  accountId: z.uuid(),
  personId: z.uuid(),
  balance: z.number(),
  dailyWithdrawalLimit: z.number(),
  isActive: z.boolean(),
  accountType: z.enum(AccountType),
  createdAt: z.iso.datetime(),
});

export class AccountResponseDto extends createZodDto(AccountResponseSchema) {}
