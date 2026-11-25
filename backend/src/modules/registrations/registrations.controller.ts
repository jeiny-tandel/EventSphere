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
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RegistrationsService } from './registrations.service.js';
import { RegisterEventDto } from './dto/index.js';

@UseGuards(JwtAuthGuard)
@Controller()
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Post('events/:eventId/registrations')
  register(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @CurrentUser('userId') userId: string,
    @Body() _registerEventDto?: RegisterEventDto,
  ) {
    return this.registrationsService.register(eventId, userId);
  }

  @Get('registrations/my')
  findMyRegistrations(@CurrentUser('userId') userId: string) {
    return this.registrationsService.findMyRegistrations(userId);
  }

  @Get('registrations/:id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.registrationsService.findOne(id, userId);
  }

  @Patch('registrations/:id/cancel')
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.registrationsService.cancel(id, userId);
  }
}
