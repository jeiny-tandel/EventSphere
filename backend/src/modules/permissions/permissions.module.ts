import { Module } from '@nestjs/common';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { PermissionsController } from './permissions.controller.js';
import { PermissionsService } from './permissions.service.js';
import { PermissionCategoriesController } from './permission-categories.controller.js';
import { PermissionCategoriesService } from './permission-categories.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [PermissionsController, PermissionCategoriesController],
  providers: [
    PermissionsService,
    PermissionCategoriesService,
    PermissionsGuard,
  ],
  exports: [PermissionsService, PermissionCategoriesService],
})
export class PermissionsModule {}
