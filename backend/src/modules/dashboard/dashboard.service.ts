import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

const ACTIVE_REGISTRATION_STATUSES = ['PENDING', 'CONFIRMED'] as const;

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(currentUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User does not exist or is inactive');
    }

    const permissionSet = new Set(
      user.role?.permissions.map((rp) => rp.permission.name) ?? [],
    );
    const roleName = user.role?.name?.trim().toLowerCase() ?? '';
    const isAdmin = roleName === 'admin';
    const isOrganizer =
      roleName === 'organizer' ||
      permissionSet.has('events.create') ||
      permissionSet.has('events.update') ||
      permissionSet.has('events.delete');
    const canViewUsers = permissionSet.has('users.view');
    const canViewEvents =
      isAdmin || (isOrganizer && permissionSet.has('events.view'));

    const scope: 'global' | 'organizer' | 'restricted' = isAdmin
      ? 'global'
      : canViewEvents
        ? 'organizer'
        : 'restricted';

    const eventWhere: Prisma.EventWhereInput =
      scope === 'global'
        ? {}
        : scope === 'organizer'
          ? { organizerId: currentUserId }
          : { id: { in: [] } };

    const now = new Date();
    const trendWindowStart = new Date(now);
    trendWindowStart.setUTCDate(trendWindowStart.getUTCDate() - 29);
    trendWindowStart.setUTCHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalEvents,
      publishedEvents,
      activeTicketsAgg,
      trendRows,
      categoryGroups,
      statusGroups,
      popularGroups,
      recentRegistrationsRaw,
      upcomingEventsRaw,
    ] = await Promise.all([
      canViewUsers ? this.prisma.user.count() : Promise.resolve(null),
      this.prisma.event.count({ where: eventWhere }),
      this.prisma.event.count({
        where: { ...eventWhere, status: 'PUBLISHED' },
      }),
      (this.prisma as any).eventRegistration.aggregate({
        where: {
          status: { in: [...ACTIVE_REGISTRATION_STATUSES] },
          event: eventWhere,
        },
        _sum: { quantity: true },
        _count: { id: true },
      }),
      (this.prisma as any).eventRegistration.findMany({
        where: {
          status: { in: [...ACTIVE_REGISTRATION_STATUSES] },
          createdAt: { gte: trendWindowStart },
          event: eventWhere,
        },
        select: {
          createdAt: true,
          quantity: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.event.groupBy({
        by: ['categoryId'],
        where: eventWhere,
        _count: { id: true },
      }),
      (this.prisma as any).eventRegistration.groupBy({
        by: ['status'],
        where: { event: eventWhere },
        _count: { id: true },
        _sum: { quantity: true },
      }),
      (this.prisma as any).eventRegistration.groupBy({
        by: ['eventId'],
        where: {
          status: { in: [...ACTIVE_REGISTRATION_STATUSES] },
          event: eventWhere,
        },
        _sum: { quantity: true },
        _count: { id: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      (this.prisma as any).eventRegistration.findMany({
        where: { event: eventWhere },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          event: {
            select: {
              id: true,
              title: true,
              price: true,
              startDate: true,
            },
          },
        },
      }),
      this.prisma.event.findMany({
        where: {
          ...eventWhere,
          status: 'PUBLISHED',
          startDate: { gte: now },
        },
        orderBy: { startDate: 'asc' },
        take: 5,
        include: {
          category: {
            select: { id: true, name: true },
          },
        },
      }),
    ]);

    const categoryIds = categoryGroups.map((g) => g.categoryId);
    const popularEventIds = (popularGroups as Array<{ eventId: string }>).map(
      (g) => g.eventId,
    );
    const upcomingEventIds = upcomingEventsRaw.map((e) => e.id);

    const [categories, popularEventDetails, upcomingTicketGroups] =
      await Promise.all([
        categoryIds.length > 0
          ? this.prisma.eventCategory.findMany({
              where: { id: { in: categoryIds } },
              select: { id: true, name: true },
            })
          : Promise.resolve([]),
        popularEventIds.length > 0
          ? this.prisma.event.findMany({
              where: { id: { in: popularEventIds } },
              include: {
                category: { select: { id: true, name: true } },
              },
            })
          : Promise.resolve([]),
        upcomingEventIds.length > 0
          ? (this.prisma as any).eventRegistration.groupBy({
              by: ['eventId'],
              where: {
                eventId: { in: upcomingEventIds },
                status: { in: [...ACTIVE_REGISTRATION_STATUSES] },
              },
              _sum: { quantity: true },
            })
          : Promise.resolve([]),
      ]);

    const categoryNameMap = new Map(categories.map((c) => [c.id, c.name]));
    const eventsByCategory = categoryGroups
      .map((group) => ({
        categoryId: group.categoryId,
        categoryName: categoryNameMap.get(group.categoryId) ?? 'Uncategorized',
        count: group._count.id,
      }))
      .sort((a, b) => b.count - a.count);

    const trendMap = new Map<
      string,
      { date: string; tickets: number; registrations: number }
    >();
    for (const row of trendRows as Array<{
      createdAt: Date;
      quantity?: number;
    }>) {
      const dateKey = row.createdAt.toISOString().slice(0, 10);
      const existing = trendMap.get(dateKey) ?? {
        date: dateKey,
        tickets: 0,
        registrations: 0,
      };
      existing.tickets += row.quantity ?? 1;
      existing.registrations += 1;
      trendMap.set(dateKey, existing);
    }
    const registrationTrends = Array.from(trendMap.values());

    const statusGroupMap = new Map<
      string,
      { count: number; tickets: number }
    >(
      (
        statusGroups as Array<{
          status: string;
          _count: { id: number };
          _sum?: { quantity?: number | null };
        }>
      ).map((row) => [
        row.status,
        {
          count: row._count.id,
          tickets: row._sum?.quantity ?? 0,
        },
      ]),
    );
    const registrationsByStatus = ['PENDING', 'CONFIRMED', 'CANCELLED'].map(
      (status) => {
        const entry = statusGroupMap.get(status);
        return {
          status,
          count: entry?.count ?? 0,
          tickets: entry?.tickets ?? 0,
        };
      },
    );

    const popularEventMap = new Map(
      popularEventDetails.map((e) => [e.id, e]),
    );
    const popularEvents = (
      popularGroups as Array<{
        eventId: string;
        _sum?: { quantity?: number | null };
        _count: { id: number };
      }>
    )
      .map((group) => {
        const event = popularEventMap.get(group.eventId) as any;
        if (!event) return null;
        const ticketsBooked = group._sum?.quantity ?? 0;
        const capacity: number | null = event.capacity ?? null;
        const remainingSeats =
          capacity !== null ? Math.max(0, capacity - ticketsBooked) : null;
        const price = Number(event.price ?? 0);

        return {
          id: event.id,
          title: event.title,
          categoryName: event.category?.name ?? 'Uncategorized',
          startDate: event.startDate,
          capacity,
          price,
          ticketsBooked,
          registrationsCount: group._count.id,
          remainingSeats,
          estimatedBookingValue: ticketsBooked * price,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const upcomingTicketMap = new Map<string, number>(
      (
        upcomingTicketGroups as Array<{
          eventId: string;
          _sum?: { quantity?: number | null };
        }>
      ).map((row) => [row.eventId, row._sum?.quantity ?? 0]),
    );
    const upcomingEvents = upcomingEventsRaw.map((event: any) => {
      const ticketsBooked = upcomingTicketMap.get(event.id) ?? 0;
      const capacity: number | null = event.capacity ?? null;
      const remainingSeats =
        capacity !== null ? Math.max(0, capacity - ticketsBooked) : null;

      return {
        id: event.id,
        title: event.title,
        categoryName: event.category?.name ?? 'Uncategorized',
        location: event.location,
        startDate: event.startDate,
        endDate: event.endDate,
        capacity,
        price: Number(event.price ?? 0),
        ticketsBooked,
        remainingSeats,
      };
    });

    const recentRegistrations = (recentRegistrationsRaw as Array<any>).map(
      (reg) => {
        const quantity = reg.quantity ?? 1;
        const unitPrice = Number(reg.event?.price ?? 0);
        const fullName = reg.user
          ? `${reg.user.firstName ?? ''} ${reg.user.lastName ?? ''}`.trim()
          : 'Unknown User';

        return {
          id: reg.id,
          quantity,
          status: reg.status,
          createdAt: reg.createdAt,
          totalPrice: unitPrice * quantity,
          attendee: {
            id: reg.user?.id ?? '',
            name: fullName || reg.user?.email || 'Unknown User',
            email: reg.user?.email ?? '',
          },
          event: {
            id: reg.event?.id ?? reg.eventId,
            title: reg.event?.title ?? 'Unknown Event',
            price: unitPrice,
            startDate: reg.event?.startDate ?? null,
          },
        };
      },
    );

    return {
      scope,
      permissions: {
        canViewUsers,
        canViewEvents,
      },
      metrics: {
        totalUsers,
        totalEvents,
        publishedEvents,
        totalTicketsBooked: activeTicketsAgg._sum?.quantity ?? 0,
        totalActiveRegistrations: activeTicketsAgg._count?.id ?? 0,
      },
      charts: {
        registrationTrends,
        eventsByCategory,
        registrationsByStatus,
        popularEvents,
      },
      tables: {
        recentRegistrations,
        upcomingEvents,
        popularEvents,
      },
    };
  }
}
