import { PartialType } from '@nestjs/mapped-types';
import { CreatePermissionCategoryDto } from './create-permission-category.dto.js';

export class UpdatePermissionCategoryDto extends PartialType(
  CreatePermissionCategoryDto,
) {}
