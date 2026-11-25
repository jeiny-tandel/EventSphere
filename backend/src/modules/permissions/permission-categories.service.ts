import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  CreatePermissionCategoryDto,
  UpdatePermissionCategoryDto,
} from './dto/index.js';

@Injectable()
export class PermissionCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.permissionCategory.findMany({
      include: {
        _count: {
          select: { permissions: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.permissionCategory.findUnique({
      where: { id },
      include: {
        permissions: true,
        _count: {
          select: { permissions: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(
        `Permission category with ID '${id}' not found`,
      );
    }

    return category;
  }

  async create(createPermissionCategoryDto: CreatePermissionCategoryDto) {
    try {
      return await this.prisma.permissionCategory.create({
        data: {
          name: createPermissionCategoryDto.name,
          description: createPermissionCategoryDto.description,
        },
        include: {
          _count: {
            select: { permissions: true },
          },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Permission category with name '${createPermissionCategoryDto.name}' already exists`,
        );
      }
      throw error;
    }
  }

  async update(
    id: string,
    updatePermissionCategoryDto: UpdatePermissionCategoryDto,
  ) {
    await this.findOne(id);

    const data: {
      name?: string;
      description?: string;
    } = {};

    if (updatePermissionCategoryDto.name !== undefined) {
      data.name = updatePermissionCategoryDto.name;
    }
    if (updatePermissionCategoryDto.description !== undefined) {
      data.description = updatePermissionCategoryDto.description;
    }

    try {
      return await this.prisma.permissionCategory.update({
        where: { id },
        data,
        include: {
          _count: {
            select: { permissions: true },
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const message = updatePermissionCategoryDto.name
            ? `Permission category with name '${updatePermissionCategoryDto.name}' already exists`
            : 'Permission category name already exists';
          throw new ConflictException(message);
        }

        if (error.code === 'P2025') {
          throw new NotFoundException(
            `Permission category with ID '${id}' not found`,
          );
        }
      }
      throw error;
    }
  }

  async remove(id: string) {
    await this.findOne(id);

    const permissionCount = await this.prisma.permission.count({
      where: { categoryId: id },
    });

    if (permissionCount > 0) {
      throw new ConflictException(
        `Cannot delete permission category with ID '${id}' because it is associated with ${permissionCount} existing permission(s). Please reassign or delete the permissions first.`,
      );
    }

    try {
      return await this.prisma.permissionCategory.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new ConflictException(
            `Cannot delete permission category with ID '${id}' because it is associated with existing permissions`,
          );
        }

        if (error.code === 'P2025') {
          throw new NotFoundException(
            `Permission category with ID '${id}' not found`,
          );
        }
      }
      throw error;
    }
  }
}
