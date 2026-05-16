import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const TransactionAmountSchema = z.object({
  value: z.number().positive(),
});

export class TransactionAmountDto extends createZodDto(
  TransactionAmountSchema,
) {}
