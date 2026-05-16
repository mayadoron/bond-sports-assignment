import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { appConfigValidationSchema } from "./config/app.config";
import { PrismaModule } from "./prisma/prisma.module";
import { AccountsModule } from "./accounts/accounts.module";
import { TransactionsModule } from "./transactions/transactions.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: appConfigValidationSchema,
    }),
    PrismaModule,
    AccountsModule,
    TransactionsModule,
  ],
})
export class AppModule {}
