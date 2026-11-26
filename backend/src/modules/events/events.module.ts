import { Module } from '@nestjs/common';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { StorageModule } from '../storage/storage.module.js';
import { EventsController } from './events.controller.js';
import { EventsService } from './events.service.js';
import { EventCategoriesController } from './event-categories.controller.js';
import { EventCategoriesService } from './event-categories.service.js';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [EventsController, EventCategoriesController],
  providers: [
    EventsService,
    EventCategoriesService,
    PermissionsGuard,
  ],
  exports: [EventsService, EventCategoriesService],
})
export class EventsModule {}
