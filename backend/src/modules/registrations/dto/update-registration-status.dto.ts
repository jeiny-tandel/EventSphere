import { IsEnum, IsNotEmpty } from 'class-validator';

export enum RegistrationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export class UpdateRegistrationStatusDto {
  @IsEnum(RegistrationStatus)
  @IsNotEmpty()
  status: RegistrationStatus;
}
