import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { PermissionCategoriesService } from './permission-categories.service.js';
import {
  CreatePermissionCategoryDto,
  UpdatePermissionCategoryDto,
} from './dto/index.js';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('permission-categories')
export class PermissionCategoriesController {
  constructor(
    private readonly permissionCategoriesService: PermissionCategoriesService,
  ) {}

  @Permissions('permissions.create')
  @Post()
  create(@Body() createPermissionCategoryDto: CreatePermissionCategoryDto) {
    return this.permissionCategoriesService.create(createPermissionCategoryDto);
  }

  @Permissions('permissions.view')
  @Get()
  findAll() {
    return this.permissionCategoriesService.findAll();
  }

  @Permissions('permissions.view')
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.permissionCategoriesService.findOne(id);
  }

  @Permissions('permissions.update')
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePermissionCategoryDto: UpdatePermissionCategoryDto,
  ) {
    return this.permissionCategoriesService.update(
      id,
      updatePermissionCategoryDto,
    );
  }

  @Permissions('permissions.delete')
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.permissionCategoriesService.remove(id);
  }
}
