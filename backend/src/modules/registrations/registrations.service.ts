import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

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

@Injectable()
export class RegistrationsService {
  constructor(private readonly prisma: PrismaService) {}

  async register(eventId: string, userId: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
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

        if (event.capacity !== null && event.capacity !== undefined) {
          const activeCount = await (tx as any).eventRegistration.count({
            where: {
              eventId,
              status: { in: ['PENDING', 'CONFIRMED'] },
            },
          });

          if (activeCount >= event.capacity) {
            throw new ConflictException(
              'Event has reached maximum capacity.',
            );
          }
        }

        return await (tx as any).eventRegistration.create({
          data: {
            eventId,
            userId,
            status: 'PENDING',
          },
          include: registrationInclude,
        });
      });
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
    return (this.prisma as any).eventRegistration.findMany({
      where: { userId },
      include: registrationInclude,
      orderBy: { createdAt: 'desc' },
    });
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

    return registration;
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
      return await (this.prisma as any).eventRegistration.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: registrationInclude,
      });
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
