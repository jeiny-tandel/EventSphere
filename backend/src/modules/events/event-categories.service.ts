import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  CreateEventCategoryDto,
  UpdateEventCategoryDto,
} from './dto/index.js';

@Injectable()
export class EventCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return (this.prisma as any).eventCategory.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const category = await (this.prisma as any).eventCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Event category with ID '${id}' not found`);
    }

    return category;
  }

  async create(createCategoryDto: CreateEventCategoryDto) {
    const existing = await (this.prisma as any).eventCategory.findUnique({
      where: { name: createCategoryDto.name },
    });

    if (existing) {
      throw new ConflictException(
        `Event category with name '${createCategoryDto.name}' already exists`,
      );
    }

    try {
      return await (this.prisma as any).eventCategory.create({
        data: {
          name: createCategoryDto.name,
          description: createCategoryDto.description,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Event category with name '${createCategoryDto.name}' already exists`,
        );
      }
      throw error;
    }
  }

  async update(id: string, updateCategoryDto: UpdateEventCategoryDto) {
    await this.findOne(id);

    if (updateCategoryDto.name !== undefined) {
      const existing = await (this.prisma as any).eventCategory.findUnique({
        where: { name: updateCategoryDto.name },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Event category with name '${updateCategoryDto.name}' already exists`,
        );
      }
    }

    const data: { name?: string; description?: string } = {};
    if (updateCategoryDto.name !== undefined) {
      data.name = updateCategoryDto.name;
    }
    if (updateCategoryDto.description !== undefined) {
      data.description = updateCategoryDto.description;
    }

    try {
      return await (this.prisma as any).eventCategory.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            `Event category with name '${updateCategoryDto.name}' already exists`,
          );
        }
        if (error.code === 'P2025') {
          throw new NotFoundException(
            `Event category with ID '${id}' not found`,
          );
        }
      }
      throw error;
    }
  }

  async remove(id: string) {
    await this.findOne(id);

    const eventCount = await (this.prisma as any).event.count({
      where: { categoryId: id },
    });

    if (eventCount > 0) {
      throw new ConflictException(
        `Cannot delete event category with ID '${id}' because it is associated with existing events`,
      );
    }

    try {
      return await (this.prisma as any).eventCategory.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new ConflictException(
          `Cannot delete event category with ID '${id}' because it is associated with existing events`,
        );
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(
          `Event category with ID '${id}' not found`,
        );
      }
      throw error;
    }
  }
}
