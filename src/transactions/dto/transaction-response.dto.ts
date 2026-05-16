import { TransactionType } from "@prisma/client";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const TransactionResponseSchema = z.object({
  transactionId: z.uuid(),
  accountId: z.uuid(),
  value: z.number(),
  type: z.enum(TransactionType),
  transactionDate: z.iso.datetime(),
});

export class TransactionResponseDto extends createZodDto(
  TransactionResponseSchema,
) {}
