import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePermissionCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
