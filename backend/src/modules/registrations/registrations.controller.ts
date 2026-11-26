import {
  Body,
  Controller,
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
import { RegistrationsService } from './registrations.service.js';
import { RegisterEventDto, UpdateRegistrationStatusDto } from './dto/index.js';

@UseGuards(JwtAuthGuard)
@Controller()
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Post('events/:eventId/registrations')
  register(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @CurrentUser('userId') userId: string,
    @Body() registerEventDto?: RegisterEventDto,
  ) {
    return this.registrationsService.register(
      eventId,
      userId,
      registerEventDto?.quantity ?? 1,
    );
  }

  @Get('registrations/my')
  findMyRegistrations(@CurrentUser('userId') userId: string) {
    return this.registrationsService.findMyRegistrations(userId);
  }

  @UseGuards(PermissionsGuard)
  @Permissions('registrations.view')
  @Get('registrations/manage')
  findManagementRegistrations(@CurrentUser('userId') currentUserId: string) {
    return this.registrationsService.findManagementRegistrations(currentUserId);
  }

  @Get('registrations/:id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.registrationsService.findOne(id, userId);
  }

  @UseGuards(PermissionsGuard)
  @Permissions('registrations.update')
  @Patch('registrations/:id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') currentUserId: string,
    @Body() updateRegistrationStatusDto: UpdateRegistrationStatusDto,
  ) {
    return this.registrationsService.updateStatus(
      id,
      currentUserId,
      updateRegistrationStatusDto,
    );
  }

  @Patch('registrations/:id/cancel')
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.registrationsService.cancel(id, userId);
  }
}
