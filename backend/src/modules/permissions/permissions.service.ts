import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreatePermissionDto, UpdatePermissionDto } from './dto/index.js';

const permissionInclude = {
  category: true,
};

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPermissionDto: CreatePermissionDto) {
    const category = await this.prisma.permissionCategory.findUnique({
      where: { id: createPermissionDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException(
        `Permission category with ID '${createPermissionDto.categoryId}' not found`,
      );
    }

    try {
      return await this.prisma.permission.create({
        data: {
          name: createPermissionDto.name,
          description: createPermissionDto.description,
          categoryId: createPermissionDto.categoryId,
        },
        include: permissionInclude,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Permission with name '${createPermissionDto.name}' already exists`,
        );
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new NotFoundException(
          `Permission category with ID '${createPermissionDto.categoryId}' not found`,
        );
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.permission.findMany({
      include: permissionInclude,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
      include: permissionInclude,
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID '${id}' not found`);
    }

    return permission;
  }

  async update(id: string, updatePermissionDto: UpdatePermissionDto) {
    await this.findOne(id);

    if (updatePermissionDto.categoryId !== undefined) {
      const category = await this.prisma.permissionCategory.findUnique({
        where: { id: updatePermissionDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException(
          `Permission category with ID '${updatePermissionDto.categoryId}' not found`,
        );
      }
    }

    const data: {
      name?: string;
      description?: string;
      categoryId?: string;
    } = {};

    if (updatePermissionDto.name !== undefined) {
      data.name = updatePermissionDto.name;
    }
    if (updatePermissionDto.description !== undefined) {
      data.description = updatePermissionDto.description;
    }
    if (updatePermissionDto.categoryId !== undefined) {
      data.categoryId = updatePermissionDto.categoryId;
    }

    try {
      return await this.prisma.permission.update({
        where: { id },
        data,
        include: permissionInclude,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const message = updatePermissionDto.name
            ? `Permission with name '${updatePermissionDto.name}' already exists`
            : 'Permission name already exists';
          throw new ConflictException(message);
        }

        if (error.code === 'P2025') {
          throw new NotFoundException(`Permission with ID '${id}' not found`);
        }

        if (error.code === 'P2003') {
          throw new NotFoundException(
            `Permission category with ID '${updatePermissionDto.categoryId}' not found`,
          );
        }
      }
      throw error;
    }
  }

  async remove(id: string) {
    await this.findOne(id);

    try {
      return await this.prisma.permission.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new ConflictException(
          `Cannot delete permission with ID '${id}' because it is assigned to one or more roles`,
        );
      }
      throw error;
    }
  }
}
