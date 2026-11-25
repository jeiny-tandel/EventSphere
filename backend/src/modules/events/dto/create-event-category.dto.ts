import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEventCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
