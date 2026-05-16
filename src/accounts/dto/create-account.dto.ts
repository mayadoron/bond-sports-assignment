import { AccountType } from "@prisma/client";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const MAX_DECIMAL_PLACES = 2;

const decimalPrecision = (val: number) =>
  Number.isInteger(val * 10 ** MAX_DECIMAL_PLACES);

export const CreateAccountSchema = z.object({
  personId: z.uuid(),
  dailyWithdrawalLimit: z.number().gte(0),
  initialBalance: z.number().gte(0).optional(),
  accountType: z.enum(AccountType),
});

export class CreateAccountDto extends createZodDto(CreateAccountSchema) {}
