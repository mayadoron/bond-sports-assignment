import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { TransactionAmountDto } from './dto/transaction-amount.dto';
import { StatementFilterDto } from './dto/statement-filter.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';

@ApiTags('transactions')
@Controller('accounts/:accountId')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('deposit')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Deposit funds into an account' })
  @ApiCreatedResponse({ type: TransactionResponseDto })
  @ApiNotFoundResponse({ description: 'Account not found' })
  @ApiConflictResponse({ description: 'Account is inactive' })
  deposit(
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Body() dto: TransactionAmountDto,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.deposit(accountId, dto);
  }

  @Post('withdrawal')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Withdraw funds from an account' })
  @ApiCreatedResponse({ type: TransactionResponseDto })
  @ApiNotFoundResponse({ description: 'Account not found' })
  @ApiConflictResponse({ description: 'Account is inactive' })
  @ApiUnprocessableEntityResponse({
    description: 'Insufficient funds or daily withdrawal limit exceeded',
  })
  withdraw(
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Body() dto: TransactionAmountDto,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.withdraw(accountId, dto);
  }

  @Get('statement')
  @ApiOperation({
    summary: 'Retrieve account transaction statement, optionally filtered by date range',
  })
  @ApiOkResponse({ type: [TransactionResponseDto] })
  @ApiNotFoundResponse({ description: 'Account not found' })
  @ApiQuery({ name: 'from', required: false, schema: { type: 'string', format: 'date-time' }, description: 'Start of date range (ISO 8601)' })
  @ApiQuery({ name: 'to', required: false, schema: { type: 'string', format: 'date-time' }, description: 'End of date range (ISO 8601)' })
  getStatement(
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Query() filter: StatementFilterDto,
  ): Promise<TransactionResponseDto[]> {
    return this.transactionsService.getStatement(accountId, filter);
  }
}
