import { IsEnum } from 'class-validator';

export enum CreditPackDto {
  PACK_5 = 'PACK_5',
  PACK_10 = 'PACK_10',
}

export class CreateCreditOrderDto {
  @IsEnum(CreditPackDto)
  pack: CreditPackDto;
}
