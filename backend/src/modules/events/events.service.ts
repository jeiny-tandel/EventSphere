import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
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
};

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizerId: string, createEventDto: CreateEventDto) {
    const category = await (this.prisma as any).eventCategory.findUnique({
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
      return await (this.prisma as any).event.create({
        data: {
          title: createEventDto.title,
          description: createEventDto.description,
          organizerId,
          categoryId: createEventDto.categoryId,
          location: createEventDto.location,
          startDate: new Date(createEventDto.startDate),
          endDate: new Date(createEventDto.endDate),
          capacity: createEventDto.capacity,
          status: createEventDto.status ?? EventStatus.DRAFT,
        },
        include: eventInclude,
      });
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

  async findAll() {
    return (this.prisma as any).event.findMany({
      where: {
        status: EventStatus.PUBLISHED,
      },
      include: eventInclude,
      orderBy: { createdAt: 'desc' },
    });
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

    const where = isAdmin ? {} : { organizerId: currentUserId };

    return (this.prisma as any).event.findMany({
      where,
      include: eventInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const event = await (this.prisma as any).event.findUnique({
      where: { id },
      include: eventInclude,
    });

    if (!event) {
      throw new NotFoundException(`Event with ID '${id}' not found`);
    }

    return event;
  }

  async update(
    id: string,
    currentUserId: string,
    updateEventDto: UpdateEventDto,
  ) {
    const existingEvent = await this.findOne(id);

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

    if (updateEventDto.categoryId !== undefined) {
      const category = await (this.prisma as any).eventCategory.findUnique({
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

    const data: {
      title?: string;
      description?: string;
      categoryId?: string;
      location?: string;
      startDate?: Date;
      endDate?: Date;
      capacity?: number;
      status?: EventStatus;
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
    if (updateEventDto.status !== undefined)
      data.status = updateEventDto.status;

    try {
      return await (this.prisma as any).event.update({
        where: { id },
        data,
        include: eventInclude,
      });
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

    try {
      return await (this.prisma as any).event.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Event with ID '${id}' not found`);
        }
      }
      throw error;
    }
  }
}
