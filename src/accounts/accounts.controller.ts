import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { AccountResponseDto } from './dto/account-response.dto';

@ApiTags('accounts')
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new bank account' })
  @ApiCreatedResponse({ type: AccountResponseDto })
  @ApiUnprocessableEntityResponse({ description: 'Validation error' })
  createAccount(@Body() dto: CreateAccountDto): Promise<AccountResponseDto> {
    return this.accountsService.createAccount(dto);
  }

  @Get(':accountId')
  @ApiOperation({ summary: 'Retrieve an account by its ID' })
  @ApiOkResponse({ type: AccountResponseDto })
  @ApiNotFoundResponse({ description: 'Account not found' })
  findAccount(
    @Param('accountId', ParseUUIDPipe) accountId: string,
  ): Promise<AccountResponseDto> {
    return this.accountsService.findAccountById(accountId);
  }

  @Patch(':accountId/block')
  @ApiOperation({ summary: 'Block an account, preventing all transactions' })
  @ApiOkResponse({ type: AccountResponseDto })
  @ApiNotFoundResponse({ description: 'Account not found' })
  blockAccount(
    @Param('accountId', ParseUUIDPipe) accountId: string,
  ): Promise<AccountResponseDto> {
    return this.accountsService.blockAccount(accountId);
  }

  @Patch(':accountId/unblock')
  @ApiOperation({ summary: 'Unblock an account, re-enabling transactions' })
  @ApiOkResponse({ type: AccountResponseDto })
  @ApiNotFoundResponse({ description: 'Account not found' })
  unblockAccount(
    @Param('accountId', ParseUUIDPipe) accountId: string,
  ): Promise<AccountResponseDto> {
    return this.accountsService.unblockAccount(accountId);
  }
}
