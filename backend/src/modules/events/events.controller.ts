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
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { EventsService } from './events.service.js';
import { CreateEventDto, UpdateEventDto } from './dto/index.js';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('events.create')
  @Post()
  create(
    @CurrentUser('userId') organizerId: string,
    @Body() createEventDto: CreateEventDto,
  ) {
    return this.eventsService.create(organizerId, createEventDto);
  }

  @Get()
  findAll() {
    return this.eventsService.findAll();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('events.view')
  @Get('manage')
  findManagementEvents(@CurrentUser('userId') currentUserId: string) {
    return this.eventsService.findManagementEvents(currentUserId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('events.update')
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') currentUserId: string,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return this.eventsService.update(id, currentUserId, updateEventDto);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('events.delete')
  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') currentUserId: string,
  ) {
    return this.eventsService.remove(id, currentUserId);
  }
}
