import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { UpdateRegistrationStatusDto } from './dto/index.js';

const registrationInclude = {
  event: {
    include: {
      category: true,
      organizer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  },
};

const managementRegistrationInclude = {
  ...registrationInclude,
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
};

@Injectable()
export class RegistrationsService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeRegistration<
    T extends { event?: { price?: unknown } | null },
  >(registration: T): T {
    if (!registration.event) {
      return registration;
    }

    return {
      ...registration,
      event: {
        ...registration.event,
        price: Number(registration.event.price ?? 0),
      },
    };
  }

  async register(eventId: string, userId: string, requestedQuantity = 1) {
    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
      throw new BadRequestException('Quantity must be an integer of at least 1.');
    }

    try {
      const registration = await this.prisma.$transaction(async (tx) => {
        // Lock the Event row to serialize concurrent bookings for the same event
        await (tx as any).$queryRaw`SELECT id FROM "Event" WHERE id = ${eventId}::uuid FOR UPDATE`;

        const event = await (tx as any).event.findUnique({
          where: { id: eventId },
        });

        if (!event) {
          throw new NotFoundException(`Event with ID '${eventId}' not found`);
        }

        if (event.status !== 'PUBLISHED') {
          throw new BadRequestException(
            `Cannot register for an event that is not published (current status: ${event.status})`,
          );
        }

        const existingActiveRegistration = await (
          tx as any
        ).eventRegistration.findFirst({
          where: {
            eventId,
            userId,
            status: { in: ['PENDING', 'CONFIRMED'] },
          },
        });

        if (existingActiveRegistration) {
          throw new ConflictException(
            'You already have an active registration for this event.',
          );
        }

        const maxTicketsPerUser: number = event.maxTicketsPerUser ?? 5;
        if (requestedQuantity > maxTicketsPerUser) {
          throw new BadRequestException(
            `You can book at most ${maxTicketsPerUser} ticket${maxTicketsPerUser === 1 ? '' : 's'} for this event.`,
          );
        }

        if (event.capacity !== null && event.capacity !== undefined) {
          const activeAggregate = await (
            tx as any
          ).eventRegistration.aggregate({
            where: {
              eventId,
              status: { in: ['PENDING', 'CONFIRMED'] },
            },
            _sum: { quantity: true },
          });

          const occupiedSeats: number = activeAggregate._sum?.quantity ?? 0;

          if (occupiedSeats + requestedQuantity > event.capacity) {
            const remainingSeats = Math.max(0, event.capacity - occupiedSeats);
            throw new ConflictException(
              remainingSeats === 0
                ? 'Event has reached maximum capacity.'
                : `Only ${remainingSeats} seat${remainingSeats === 1 ? '' : 's'} remaining for this event.`,
            );
          }
        }

        return await (tx as any).eventRegistration.create({
          data: {
            eventId,
            userId,
            quantity: requestedQuantity,
            status: 'PENDING',
          },
          include: registrationInclude,
        });
      });

      return this.normalizeRegistration(registration);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'You already have an active registration for this event.',
        );
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new NotFoundException('Referenced event or user does not exist.');
      }
      throw error;
    }
  }

  async findMyRegistrations(userId: string) {
    const registrations = await (this.prisma as any).eventRegistration.findMany(
      {
        where: { userId },
        include: registrationInclude,
        orderBy: { createdAt: 'desc' },
      },
    );

    return registrations.map((registration: any) =>
      this.normalizeRegistration(registration),
    );
  }

  async findOne(id: string, userId: string) {
    const registration = await (
      this.prisma as any
    ).eventRegistration.findUnique({
      where: { id },
      include: registrationInclude,
    });

    if (!registration) {
      throw new NotFoundException(`Registration with ID '${id}' not found`);
    }

    if (registration.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this registration',
      );
    }

    return this.normalizeRegistration(registration);
  }

  async cancel(id: string, userId: string) {
    const registration = await (
      this.prisma as any
    ).eventRegistration.findUnique({
      where: { id },
    });

    if (!registration) {
      throw new NotFoundException(`Registration with ID '${id}' not found`);
    }

    if (registration.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to cancel this registration',
      );
    }

    if (registration.status === 'CANCELLED') {
      throw new BadRequestException('Registration is already cancelled');
    }

    try {
      const updatedRegistration = await (
        this.prisma as any
      ).eventRegistration.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: registrationInclude,
      });

      return this.normalizeRegistration(updatedRegistration);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Registration with ID '${id}' not found`);
      }
      throw error;
    }
  }

  private async resolveManagementAccess(currentUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User does not exist or is inactive');
    }

    const isAdmin = user.role?.name?.trim().toLowerCase() === 'admin';
    return { isAdmin };
  }

  async findManagementRegistrations(currentUserId: string) {
    const { isAdmin } = await this.resolveManagementAccess(currentUserId);

    const where = isAdmin ? {} : { event: { organizerId: currentUserId } };

    const registrations = await (this.prisma as any).eventRegistration.findMany(
      {
        where,
        include: managementRegistrationInclude,
        orderBy: { createdAt: 'desc' },
      },
    );

    return registrations.map((registration: any) =>
      this.normalizeRegistration(registration),
    );
  }

  async updateStatus(
    id: string,
    currentUserId: string,
    dto: UpdateRegistrationStatusDto,
  ) {
    const { isAdmin } = await this.resolveManagementAccess(currentUserId);

    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        const registration = await (
          tx as any
        ).eventRegistration.findUnique({
          where: { id },
          include: {
            event: {
              select: {
                id: true,
                organizerId: true,
                capacity: true,
              },
            },
          },
        });

        if (!registration) {
          throw new NotFoundException(`Registration with ID '${id}' not found`);
        }

        if (!isAdmin && registration.event?.organizerId !== currentUserId) {
          throw new ForbiddenException(
            'You do not have permission to manage this registration',
          );
        }

        if (registration.status === dto.status) {
          throw new BadRequestException(
            `Registration is already ${dto.status}`,
          );
        }

        if (
          registration.status === 'CONFIRMED' &&
          dto.status === 'PENDING'
        ) {
          throw new BadRequestException(
            'Cannot revert a confirmed registration back to pending',
          );
        }

        const isReactivating =
          registration.status === 'CANCELLED' &&
          (dto.status === 'PENDING' || dto.status === 'CONFIRMED');

        if (isReactivating) {
          // Lock the Event row to serialize concurrent capacity-consuming changes
          await (tx as any).$queryRaw`SELECT id FROM "Event" WHERE id = ${registration.eventId}::uuid FOR UPDATE`;

          const event = await (tx as any).event.findUnique({
            where: { id: registration.eventId },
          });

          if (!event) {
            throw new NotFoundException(
              `Event with ID '${registration.eventId}' not found`,
            );
          }

          const existingActiveForUser = await (
            tx as any
          ).eventRegistration.findFirst({
            where: {
              eventId: registration.eventId,
              userId: registration.userId,
              id: { not: registration.id },
              status: { in: ['PENDING', 'CONFIRMED'] },
            },
          });

          if (existingActiveForUser) {
            throw new ConflictException(
              'Attendee already has another active registration for this event.',
            );
          }

          if (event.capacity !== null && event.capacity !== undefined) {
            const activeAggregate = await (
              tx as any
            ).eventRegistration.aggregate({
              where: {
                eventId: registration.eventId,
                status: { in: ['PENDING', 'CONFIRMED'] },
              },
              _sum: { quantity: true },
            });

            const occupiedSeats: number = activeAggregate._sum?.quantity ?? 0;
            const requestedQuantity: number = registration.quantity ?? 1;

            if (occupiedSeats + requestedQuantity > event.capacity) {
              const remainingSeats = Math.max(
                0,
                event.capacity - occupiedSeats,
              );
              throw new ConflictException(
                remainingSeats === 0
                  ? 'Event has reached maximum capacity.'
                  : `Only ${remainingSeats} seat${remainingSeats === 1 ? '' : 's'} remaining for this event.`,
              );
            }
          }
        }

        return await (tx as any).eventRegistration.update({
          where: { id },
          data: { status: dto.status },
          include: managementRegistrationInclude,
        });
      });

      return this.normalizeRegistration(updated);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Registration with ID '${id}' not found`);
      }
      throw error;
    }
  }
}
