import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';
import { type ValidatedImageFile } from '../../common/pipes/file-validation.pipe.js';
import { CreateEventDto, EventStatus, UpdateEventDto } from './dto/index.js';

const eventInclude = {
  category: true,
  organizer: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
} satisfies Prisma.EventInclude;

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async create(organizerId: string, createEventDto: CreateEventDto) {
    const category = await this.prisma.eventCategory.findUnique({
      where: { id: createEventDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException(
        `Event category with ID '${createEventDto.categoryId}' not found`,
      );
    }

    if (new Date(createEventDto.endDate) <= new Date(createEventDto.startDate)) {
      throw new BadRequestException('endDate must be after startDate');
    }

    try {
      const createdEvent = await (this.prisma.event as any).create({
        data: {
          title: createEventDto.title,
          description: createEventDto.description,
          organizerId,
          categoryId: createEventDto.categoryId,
          location: createEventDto.location,
          startDate: new Date(createEventDto.startDate),
          endDate: new Date(createEventDto.endDate),
          capacity: createEventDto.capacity,
          ...(createEventDto.price !== undefined && {
            price: createEventDto.price,
          }),
          ...(createEventDto.maxTicketsPerUser !== undefined && {
            maxTicketsPerUser: createEventDto.maxTicketsPerUser,
          }),
          status: createEventDto.status ?? EventStatus.DRAFT,
        },
        include: eventInclude,
      });

      return this.formatEventWithAvailability(createdEvent, 0);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new NotFoundException(
            'Referenced relation record does not exist',
          );
        }
      }
      throw error;
    }
  }

  private formatEventWithAvailability<
    T extends { capacity: number | null; price?: unknown },
  >(event: T, registeredCount: number) {
    const remainingSeats =
      event.capacity !== null && event.capacity !== undefined
        ? Math.max(0, event.capacity - registeredCount)
        : null;
    const isSoldOut =
      event.capacity !== null &&
      event.capacity !== undefined &&
      registeredCount >= event.capacity;

    return {
      ...event,
      price: Number(event.price ?? 0),
      registeredCount,
      remainingSeats,
      isSoldOut,
    };
  }

  private async getActiveTicketCount(eventId: string): Promise<number> {
    const aggregate = await (this.prisma as any).eventRegistration.aggregate({
      where: {
        eventId,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      _sum: { quantity: true },
    });

    return aggregate._sum?.quantity ?? 0;
  }

  private async enrichEventsWithAvailability<
    T extends { id: string; capacity: number | null; price?: unknown },
  >(events: T[]) {
    if (events.length === 0) {
      return [];
    }

    const eventIds = events.map((event) => event.id);
    const groupedCounts: Array<{
      eventId: string;
      _sum?: { quantity?: number | null };
    }> = await (this.prisma as any).eventRegistration.groupBy({
      by: ['eventId'],
      where: {
        eventId: { in: eventIds },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      _sum: { quantity: true },
    });

    const countByEventId = new Map<string, number>(
      groupedCounts.map((row) => [row.eventId, row._sum?.quantity ?? 0]),
    );

    return events.map((event) =>
      this.formatEventWithAvailability(
        event,
        countByEventId.get(event.id) ?? 0,
      ),
    );
  }

  async findAll() {
    const events = await this.prisma.event.findMany({
      where: {
        status: EventStatus.PUBLISHED,
      },
      include: eventInclude,
      orderBy: { createdAt: 'desc' },
    });

    return this.enrichEventsWithAvailability(events);
  }

  async findManagementEvents(currentUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User does not exist or is inactive');
    }

    const isAdmin = user.role?.name?.trim().toLowerCase() === 'admin';

    const where: Prisma.EventWhereInput = isAdmin
      ? {}
      : { organizerId: currentUserId };

    const events = await this.prisma.event.findMany({
      where,
      include: eventInclude,
      orderBy: { createdAt: 'desc' },
    });

    return this.enrichEventsWithAvailability(events);
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: eventInclude,
    });

    if (!event) {
      throw new NotFoundException(`Event with ID '${id}' not found`);
    }

    const registeredCount = await this.getActiveTicketCount(id);
    return this.formatEventWithAvailability(event, registeredCount);
  }

  private async validateEventManagementAccess(
    existingEvent: { organizerId: string },
    currentUserId: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User does not exist or is inactive');
    }

    const isAdmin = user.role?.name?.trim().toLowerCase() === 'admin';

    if (!isAdmin && existingEvent.organizerId !== currentUserId) {
      throw new ForbiddenException(
        'You do not have permission to manage this event',
      );
    }
  }

  async update(
    id: string,
    currentUserId: string,
    updateEventDto: UpdateEventDto,
  ) {
    const existingEvent = await this.findOne(id);
    await this.validateEventManagementAccess(existingEvent, currentUserId);

    if (updateEventDto.categoryId !== undefined) {
      const category = await this.prisma.eventCategory.findUnique({
        where: { id: updateEventDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException(
          `Event category with ID '${updateEventDto.categoryId}' not found`,
        );
      }
    }

    const effectiveStartDate =
      updateEventDto.startDate !== undefined
        ? new Date(updateEventDto.startDate)
        : new Date(existingEvent.startDate);

    const effectiveEndDate =
      updateEventDto.endDate !== undefined
        ? new Date(updateEventDto.endDate)
        : new Date(existingEvent.endDate);

    if (effectiveEndDate <= effectiveStartDate) {
      throw new BadRequestException('endDate must be after startDate');
    }

    const data: Prisma.EventUncheckedUpdateInput & {
      price?: number;
      maxTicketsPerUser?: number;
    } = {};

    if (updateEventDto.title !== undefined) data.title = updateEventDto.title;
    if (updateEventDto.description !== undefined)
      data.description = updateEventDto.description;
    if (updateEventDto.categoryId !== undefined)
      data.categoryId = updateEventDto.categoryId;
    if (updateEventDto.location !== undefined)
      data.location = updateEventDto.location;
    if (updateEventDto.startDate !== undefined)
      data.startDate = new Date(updateEventDto.startDate);
    if (updateEventDto.endDate !== undefined)
      data.endDate = new Date(updateEventDto.endDate);
    if (updateEventDto.capacity !== undefined)
      data.capacity = updateEventDto.capacity;
    if (updateEventDto.price !== undefined) data.price = updateEventDto.price;
    if (updateEventDto.maxTicketsPerUser !== undefined)
      data.maxTicketsPerUser = updateEventDto.maxTicketsPerUser;
    if (updateEventDto.status !== undefined)
      data.status = updateEventDto.status;

    try {
      const updatedEvent = await this.prisma.event.update({
        where: { id },
        data: data as Prisma.EventUncheckedUpdateInput,
        include: eventInclude,
      });

      const registeredCount = await this.getActiveTicketCount(id);
      return this.formatEventWithAvailability(updatedEvent, registeredCount);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Event with ID '${id}' not found`);
        }
        if (error.code === 'P2003') {
          throw new NotFoundException(
            'Referenced relation record does not exist',
          );
        }
      }
      throw error;
    }
  }

  async remove(id: string, currentUserId: string) {
    const existingEvent = await this.findOne(id);
    await this.validateEventManagementAccess(existingEvent, currentUserId);

    const registrationCount = await this.prisma.eventRegistration.count({
      where: { eventId: id },
    });

    if (registrationCount > 0) {
      throw new ConflictException(
        'Cannot delete this event because users have registered for it. Please cancel the event instead.',
      );
    }

    try {
      const deletedEvent = await this.prisma.event.delete({
        where: { id },
      });

      if (existingEvent.coverImage) {
        try {
          await this.storageService.deleteFile(existingEvent.coverImage);
        } catch (cleanupError) {
          this.logger.warn(
            `Failed to delete cover image '${existingEvent.coverImage}' during event deletion: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`,
          );
        }
      }

      return deletedEvent;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Event with ID '${id}' not found`);
        }
        if (error.code === 'P2003') {
          throw new ConflictException(
            'Cannot delete this event because users have registered for it. Please cancel the event instead.',
          );
        }
      }
      throw error;
    }
  }

  async uploadCoverImage(
    id: string,
    currentUserId: string,
    file: ValidatedImageFile,
  ) {
    const existingEvent = await this.findOne(id);
    await this.validateEventManagementAccess(existingEvent, currentUserId);

    const storedFile = await this.storageService.saveFile(
      file.buffer,
      'events',
      file.extension,
    );

    const oldCoverImage = existingEvent.coverImage;

    let updatedEvent;
    try {
      updatedEvent = await this.prisma.event.update({
        where: { id },
        data: { coverImage: storedFile.relativePath },
        include: eventInclude,
      });
    } catch (error) {
      try {
        await this.storageService.deleteFile(storedFile.relativePath);
      } catch (cleanupError) {
        this.logger.error(
          `Failed to cleanup newly stored file '${storedFile.relativePath}' after database update failure: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`,
        );
      }
      throw error;
    }

    if (oldCoverImage) {
      try {
        await this.storageService.deleteFile(oldCoverImage);
      } catch (cleanupError) {
        this.logger.warn(
          `Failed to delete old cover image '${oldCoverImage}' after replacing cover for event '${id}': ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`,
        );
      }
    }

    const registeredCount = await this.getActiveTicketCount(id);
    return this.formatEventWithAvailability(updatedEvent, registeredCount);
  }

  async removeCoverImage(id: string, currentUserId: string) {
    const existingEvent = await this.findOne(id);
    await this.validateEventManagementAccess(existingEvent, currentUserId);

    const oldCoverImage = existingEvent.coverImage;

    const updatedEvent = await this.prisma.event.update({
      where: { id },
      data: { coverImage: null },
      include: eventInclude,
    });

    if (oldCoverImage) {
      try {
        await this.storageService.deleteFile(oldCoverImage);
      } catch (cleanupError) {
        this.logger.warn(
          `Failed to delete cover image '${oldCoverImage}' from storage for event '${id}': ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`,
        );
      }
    }

    const registeredCount = await this.getActiveTicketCount(id);
    return this.formatEventWithAvailability(updatedEvent, registeredCount);
  }
}
