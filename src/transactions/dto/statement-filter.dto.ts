import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const StatementFilterSchema = z.object({
  from: z.iso.datetime().optional(),
  to: z.iso.datetime().optional(),
});

export class StatementFilterDto extends createZodDto(StatementFilterSchema) {}
