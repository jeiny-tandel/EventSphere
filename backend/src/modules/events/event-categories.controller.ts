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
import { EventCategoriesService } from './event-categories.service.js';
import {
  CreateEventCategoryDto,
  UpdateEventCategoryDto,
} from './dto/index.js';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('event-categories')
export class EventCategoriesController {
  constructor(
    private readonly eventCategoriesService: EventCategoriesService,
  ) {}

  @Permissions('events.view')
  @Get()
  findAll() {
    return this.eventCategoriesService.findAll();
  }

  @Permissions('events.create')
  @Post()
  create(@Body() createCategoryDto: CreateEventCategoryDto) {
    return this.eventCategoriesService.create(createCategoryDto);
  }

  @Permissions('events.update')
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCategoryDto: UpdateEventCategoryDto,
  ) {
    return this.eventCategoriesService.update(id, updateCategoryDto);
  }

  @Permissions('events.delete')
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventCategoriesService.remove(id);
  }
}
